import { NextResponse } from 'next/server';
export const runtime = 'edge';

// Funzione di retry per le chiamate API fallite
async function retryFetch(url, options, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    // exponential backoff
    await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
  }
  throw lastError;
}

export async function POST(req) {
  try {
    const { message, threadId } = await req.json();
    const apiKey    = process.env.OPENAI_API_KEY;
    const assistant = process.env.ASSISTANT_ID;
    if (!apiKey || !assistant) throw new Error('ENV mancante');

    // Ottieni la lingua selezionata dall'utente
    let selectedLanguage = 'it';
    try {
      const headers = req.headers;
      if (headers.has('x-selected-language')) {
        selectedLanguage = headers.get('x-selected-language');
      }
    } catch (err) {
      console.error('Errore nel recupero della lingua:', err);
    }

    // === 1) apri o crea thread ===
    let tid = threadId;
    if (!tid) {
      const initRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta':   'assistants=v2'
        },
        body: JSON.stringify({ 
          messages: [{ 
            role: 'user', 
            content: `[SYSTEM INSTRUCTIONS]
You are Taoleia, a helpful assistant for Taormina tourism. You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. You have access to a database of activities and can provide detailed information about them. When users ask about specific activities, use the open_activity_card function to retrieve information. Always be friendly, professional, and helpful.

[USER MESSAGE]
${message}`
          }] 
        })
      });
      if (!initRes.ok) throw new Error(await initRes.text());
      tid = (await initRes.json()).id;
    } else {
      // Thread esistente, aggiungi solo il messaggio dell'utente
      const msgRes = await fetch(
        `https://api.openai.com/v1/threads/${tid}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta':   'assistants=v2'
          },
          body: JSON.stringify({ 
            role: 'user', 
            content: message 
          })
        }
      );
      if (!msgRes.ok) throw new Error(await msgRes.text());
    }

    // === 2) avvia run in streaming ===
    const runRes = await retryFetch(
      `https://api.openai.com/v1/threads/${tid}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta':   'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistant,
          stream:       true,
          tools: [{
            type: 'function',
            function: {
              name:        'open_activity_card',
              description: "Cerca un'attività per nome e restituisce i dettagli",
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: "Termine di ricerca" },
                  lang: { type: 'string', description: "Lingua per le traduzioni (it, en, fr, es, de)" }
                },
                required: ['query'],
                additionalProperties: false
              }
            }
          }]
        })
      }
    );
    if (!runRes.ok) {
      const errText = await runRes.text();
      throw new Error(`Assistants API: ${runRes.status} – ${errText}`);
    }

    // === 3) stream SSE + function-calling ===
    const reader   = runRes.body.getReader();
    const decoder  = new TextDecoder();
    const encoder  = new TextEncoder();
    const proto    = req.headers.get('x-forwarded-proto') || 'http';
    const host     = req.headers.get('host');
    const baseUrl  = `${proto}://${host}`;

    const sse = new ReadableStream({
      async start(controller) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split(/\r?\n\r?\n/);
          buffer = chunks.pop();

          for (const chunk of chunks) {
            const line = chunk.split(/\r?\n/).find(l => l.startsWith('data:'));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
            let event;
            try { event = JSON.parse(data); }
            catch { continue; }

            // gestione function-calling
            if (event.object === 'thread.run' &&
                event.required_action?.type === 'submit_tool_outputs') {
              for (const call of event.required_action.submit_tool_outputs.tool_calls) {
                if (call.function.name === 'open_activity_card') {
                  const args = JSON.parse(call.function.arguments);
                  const res = await fetch(`${baseUrl}/api/open-activity-card`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ 
                      query: args.query,
                      lang: args.lang || selectedLanguage
                    })
                  });
                   
                  const result = await res.json();

                  // invia output a OpenAI
                  await fetch(
                    `https://api.openai.com/v1/threads/${tid}/runs/${event.id}/submit_tool_outputs`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'OpenAI-Beta':   'assistants=v2'
                      },
                      body: JSON.stringify({
                        tool_outputs: [{
                          tool_call_id: call.id,
                          output:       JSON.stringify(result)
                        }]
                      })
                    }
                  );

                  // inoltra subito al client
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'tool_call_result', data: result })}\n\n`
                  ));
                }
              }
              continue;
            }

            // tutti gli altri eventi
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        }
      }
    });

    return new Response(sse, {
      headers: {
        'Content-Type':              'text/event-stream',
        'Cache-Control':             'no-cache, no-transform',
        'Connection':                'keep-alive',
        'X-Thread-Id':               tid,
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
