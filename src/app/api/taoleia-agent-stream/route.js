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

function extractSseData(block) {
  const lines = block.split(/\r?\n/);
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const joined = dataLines.join('\n');
  const trimmed = joined.trim();
  return trimmed.length ? trimmed : null;
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

    const overlayGuidelines = [
      `IMPORTANT: Highlight ONLY the most important terms by wrapping them in double brackets like [[...]].`,
      `Use [[...]] only for real entities the user can click to explore: places, monuments, museums, beaches, restaurants, neighborhoods, or specific activities.`,
      `Max 2–4 highlights per response. Never highlight generic words (e.g. "centro", "migliore", "consiglio").`,
      `Example: "Ti consiglio [[Teatro Greco]] e [[Isola Bella]]."`,
      `Do not explain the brackets. Do not output any other special markup.`,
    ].join(' ');

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
            content: `IMPORTANT: You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. ${overlayGuidelines} Here is my message:\n\n${message} max token 200, max world 200.` 
          }] 
        })
      });
      if (!initRes.ok) throw new Error(await initRes.text());
      tid = (await initRes.json()).id;
    } else {
      // Verifica che il thread esista ancora
      try {
        const threadCheck = await fetch(
          `https://api.openai.com/v1/threads/${tid}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'OpenAI-Beta':   'assistants=v2'
            }
          }
        );
        
        if (!threadCheck.ok) {
          // Se il thread non esiste più, creane uno nuovo
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
                content: `IMPORTANT: You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. ${overlayGuidelines} Here is my message:\n\n${message}` 
              }] 
            })
          });
          if (!initRes.ok) throw new Error(await initRes.text());
          tid = (await initRes.json()).id;
        } else {
          // Thread esistente, prima aggiungi un messaggio di sistema per la lingua
          const sysRes = await fetch(
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
                content: `IMPORTANT: You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. ${overlayGuidelines}` 
              })
            }
          );
          
          if (!sysRes.ok) throw new Error(await sysRes.text());
          
          // Poi aggiungi il messaggio dell'utente
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
      } catch (error) {
        console.error('Errore nella verifica del thread:', error);
        // In caso di errore, crea un nuovo thread
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
              content: `IMPORTANT: You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. ${overlayGuidelines} Here is my message:\n\n${message}` 
            }] 
          })
        });
        if (!initRes.ok) throw new Error(await initRes.text());
        tid = (await initRes.json()).id;
      }
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
          tools: [
            {
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
            },
            {
              type: 'function',
              function: {
                name: 'open_menu',
                description: 'Apre un menu tematico e restituisce una lista di raccomandazioni',
                parameters: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', description: 'Categoria del menu' },
                    recommendations: { type: 'array', items: { type: 'object' } }
                  },
                  required: ['category', 'recommendations'],
                  additionalProperties: false
                }
              }
            }
          ]
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
        const processBlock = async (block) => {
          const data = extractSseData(block);
          if (!data) return false;
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return true;
          }
          let event;
          try { event = JSON.parse(data); }
          catch { return false; }

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

                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_call_result', data: result })}\n\n`
                ));
              } else if (call.function.name === 'open_menu') {
                const args = JSON.parse(call.function.arguments);
                const res = await fetch(`${baseUrl}/api/open-menu`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({
                    category: args.category,
                    recommendations: args.recommendations
                  })
                });

                const result = await res.json();

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

                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_call_result', data: result })}\n\n`
                ));
              }
            }
            return false;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          return false;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const ended = await processBlock(buffer);
              if (ended) return;
            }
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split(/\r?\n\r?\n/);
          buffer = chunks.pop();

          for (const chunk of chunks) {
            const ended = await processBlock(chunk);
            if (ended) return;
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Thread-Id'
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
