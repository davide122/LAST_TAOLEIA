import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL);

async function retryFetch(url, options, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    if (options?.signal?.aborted) {
      throw new Error('aborted');
    }
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    if (options?.signal?.aborted) {
      throw new Error('aborted');
    }
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

function selectVoiceId(language) {
  switch (language) {
    case 'en':
      return process.env.ELEVENLABS_VOICE_ID_EN || process.env.ELEVENLABS_VOICE_ID;
    case 'fr':
      return process.env.ELEVENLABS_VOICE_ID_FR || process.env.ELEVENLABS_VOICE_ID;
    case 'es':
      return process.env.ELEVENLABS_VOICE_ID_ES || process.env.ELEVENLABS_VOICE_ID;
    case 'de':
      return process.env.ELEVENLABS_VOICE_ID_DE || process.env.ELEVENLABS_VOICE_ID;
    case 'it':
    default:
      return process.env.ELEVENLABS_VOICE_ID;
  }
}

function findBoundaryIndex(text) {
  const boundaryRegex = /[.!?;:\n](?=\s|$)/g;
  let match;
  let lastIdx = -1;
  while ((match = boundaryRegex.exec(text)) !== null) {
    lastIdx = match.index;
  }
  return lastIdx;
}

async function listItineraries({ query, daysMin, daysMax, limit = 5 }) {
  const q = typeof query === 'string' ? query.trim() : '';
  const min = Number.isFinite(daysMin) ? daysMin : (typeof daysMin === 'number' ? daysMin : null);
  const max = Number.isFinite(daysMax) ? daysMax : (typeof daysMax === 'number' ? daysMax : null);
  const lim = Math.max(1, Math.min(10, parseInt(limit, 10) || 5));

  const like = q ? `%${q}%` : null;

  const rows = await sql`
    SELECT
      id,
      title,
      description,
      days,
      created_at
    FROM itineraries
    WHERE (${like}::text IS NULL OR title ILIKE ${like} OR description ILIKE ${like})
      AND (${min}::int IS NULL OR days >= ${min})
      AND (${max}::int IS NULL OR days <= ${max})
    ORDER BY created_at DESC
    LIMIT ${lim}
  `;

  return rows.map(r => ({
    id: r.id?.toString?.() || String(r.id),
    title: r.title,
    description: r.description || '',
    days: r.days || 1
  }));
}

async function getItineraryById(id) {
  const rows = await sql`SELECT * FROM itineraries WHERE id = ${id} LIMIT 1`;
  if (!rows.length) return null;
  const itinerary = rows[0];

  const activities = await sql`
    SELECT * FROM itinerary_activities
    WHERE itinerary_id = ${id}
    ORDER BY day_index, start_time
  `;

  const formattedActivities = activities.map(a => ({
    id: a.id?.toString?.() || String(a.id),
    title: a.title,
    dayIndex: a.day_index,
    startTime: a.start_time,
    endTime: a.end_time,
    description: a.description || ''
  }));

  return {
    id: itinerary.id?.toString?.() || String(itinerary.id),
    title: itinerary.title,
    description: itinerary.description || '',
    days: itinerary.days || 1,
    activities: formattedActivities
  };
}

function buildItineraryCard(itinerary) {
  const days = Math.max(1, itinerary.days || 1);
  const grouped = new Map();
  for (let d = 0; d < days; d++) grouped.set(d, []);
  for (const a of itinerary.activities || []) {
    const idx = Number.isFinite(a.dayIndex) ? a.dayIndex : parseInt(a.dayIndex, 10);
    if (!Number.isFinite(idx)) continue;
    if (!grouped.has(idx)) grouped.set(idx, []);
    grouped.get(idx).push(a);
  }

  const lines = [];
  for (let d = 0; d < days; d++) {
    const items = (grouped.get(d) || []).slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    if (!items.length) {
      lines.push(`Giorno ${d + 1}: (nessuna attività)`);
      continue;
    }
    for (const a of items) {
      const time = a.startTime && a.endTime ? `${a.startTime}-${a.endTime}` : '';
      const desc = a.description ? ` — ${a.description}` : '';
      lines.push(`Giorno ${d + 1}: ${time} ${a.title}${desc}`.trim());
    }
  }

  return {
    type: 'itinerary',
    itineraryId: itinerary.id,
    category: itinerary.title,
    recommendations: lines,
    timestamp: new Date().toISOString()
  };
}

export async function POST(req) {
  try {
    const { message, threadId } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const assistant = process.env.ASSISTANT_ID;
    if (!apiKey || !assistant) throw new Error('ENV mancante');
    const requestSignal = req.signal;

    let selectedLanguage = 'it';
    try {
      if (req.headers.has('x-selected-language')) {
        selectedLanguage = req.headers.get('x-selected-language');
      }
    } catch {}

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = selectVoiceId(selectedLanguage);
    if (!elevenKey || !voiceId) throw new Error('Mancano ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID');

    const overlayGuidelines = [
      `IMPORTANT: Highlight ONLY the most important terms by wrapping them in double brackets like [[...]].`,
      `Use [[...]] only for real entities the user can click to explore: places, monuments, museums, beaches, restaurants, neighborhoods, or specific activities.`,
      `Max 2–4 highlights per response. Never highlight generic words (e.g. "centro", "migliore", "consiglio").`,
      `Example: "Ti consiglio [[Teatro Greco]] e [[Isola Bella]]."`,
      `Do not explain the brackets. Do not output any other special markup.`,
    ].join(' ');

    const itineraryGuidelines = [
      `IMPORTANT: When the user asks for an itinerary/program/plan (e.g. "itinerario", "programma", "weekend", "2 giorni", "cosa fare in X giorni"), you MUST use the available tools to propose existing itineraries.`,
      `Use list_itineraries first to find matches. If one itinerary is clearly the best match, call open_itinerary to show it as a card. Otherwise, propose 2–4 options by title and days and ask which one to open.`,
      `Never invent itineraries that do not exist in the database.`,
    ].join(' ');

    const userContent = `IMPORTANT: You must respond ONLY in ${selectedLanguage.toUpperCase()} language. Do not mix languages. ${overlayGuidelines} ${itineraryGuidelines}\n\n${message}`;

    let tid = threadId;
    if (!tid) {
      const initRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        signal: requestSignal,
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: userContent
          }]
        })
      });
      if (!initRes.ok) throw new Error(await initRes.text());
      tid = (await initRes.json()).id;
    } else {
      try {
        const msgRes = await fetch(`https://api.openai.com/v1/threads/${tid}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          signal: requestSignal,
          body: JSON.stringify({ role: 'user', content: userContent })
        });
        if (!msgRes.ok) throw new Error(await msgRes.text());
      } catch (err) {
        const initRes = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          signal: requestSignal,
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: userContent
            }]
          })
        });
        if (!initRes.ok) throw new Error(await initRes.text());
        tid = (await initRes.json()).id;
      }
    }

    const runRes = await retryFetch(`https://api.openai.com/v1/threads/${tid}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      signal: requestSignal,
      body: JSON.stringify({
        assistant_id: assistant,
        stream: true,
        tools: [
          {
            type: 'function',
            function: {
              name: 'open_activity_card',
              description: "Cerca un'attività per nome e restituisce i dettagli",
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Termine di ricerca' },
                  lang: { type: 'string', description: 'Lingua per le traduzioni (it, en, fr, es, de)' }
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
          },
          {
            type: 'function',
            function: {
              name: 'list_itineraries',
              description: 'Cerca itinerari esistenti (per parole chiave e/o durata in giorni) e restituisce una lista sintetica',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Testo di ricerca (titolo/descrizione). Opzionale.' },
                  daysMin: { type: 'integer', description: 'Giorni minimi (opzionale)' },
                  daysMax: { type: 'integer', description: 'Giorni massimi (opzionale)' },
                  limit: { type: 'integer', description: 'Max risultati (1-10)' }
                },
                additionalProperties: false
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'open_itinerary',
              description: 'Apre un itinerario esistente per id e restituisce il programma completo',
              parameters: {
                type: 'object',
                properties: {
                  id: { type: ['string', 'integer'], description: 'ID itinerario' }
                },
                required: ['id'],
                additionalProperties: false
              }
            }
          }
        ]
      })
    });
    if (!runRes.ok) throw new Error(`Assistants API: ${runRes.status} – ${await runRes.text()}`);

    const reader = runRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = `${proto}://${host}`;

    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_flash_v2_5&output_format=pcm_24000`;

    let wsOuter = null;
    const sse = new ReadableStream({
      async start(controller) {
        let ws;
        let wsReadyResolve;
        let wsReadyReject;
        const wsReady = new Promise((resolve, reject) => {
          wsReadyResolve = resolve;
          wsReadyReject = reject;
        });

        const sendEvent = (obj) => {
          if (obj === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        const closeAll = async () => {
          try { ws?.close(); } catch {}
          wsOuter = null;
          try { await reader.cancel(); } catch {}
          try { controller.close(); } catch {}
        };

        let closed = false;
        const abortNow = () => {
          if (closed) return;
          closed = true;
          closeAll();
        };
        try {
          requestSignal?.addEventListener('abort', abortNow, { once: true });
        } catch {}

        let wsIsFinal = false;
        let wsHasErrored = false;
        const wsFinal = new Promise((resolve) => {
          const check = () => {
            if (wsIsFinal || wsHasErrored) resolve();
            else setTimeout(check, 20);
          };
          check();
        });

        ws = new WebSocket(wsUrl);
        wsOuter = ws;
        ws.addEventListener('open', () => {
          try {
            ws.send(JSON.stringify({
              text: ' ',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8,
                style: 0.8,
                use_speaker_boost: true
              },
              generation_config: {
                chunk_length_schedule: [50, 90, 140, 200]
              },
              xi_api_key: elevenKey
            }));
            wsReadyResolve();
          } catch (err) {
            wsHasErrored = true;
            wsReadyReject(err);
          }
        });

        ws.addEventListener('message', (evt) => {
          try {
            const payload = JSON.parse(typeof evt.data === 'string' ? evt.data : Buffer.from(evt.data).toString('utf8'));
            if (payload?.audio) {
              sendEvent({
                type: 'audio_chunk',
                format: 'pcm_24000',
                sampleRate: 24000,
                audio: payload.audio
              });
            }
            if (payload?.isFinal) {
              wsIsFinal = true;
              sendEvent({ type: 'audio_end' });
            }
          } catch {}
        });

        ws.addEventListener('error', () => {
          wsHasErrored = true;
          try { sendEvent({ type: 'audio_error' }); } catch {}
        });

        ws.addEventListener('close', () => {
          wsHasErrored = true;
        });

        try {
          await wsReady;
        } catch {
          await closeAll();
          return;
        }

        let ttsBuffer = '';
        let openaiBuffer = '';

        const sendToEleven = async (text, flush = false) => {
          if (!text || !text.trim()) return;
          try {
            ws.send(JSON.stringify({ text, flush }));
          } catch {}
        };

        const flushTtsChunks = async (force = false) => {
          const minChars = 60;
          const hardMax = 220;
          while (true) {
            const boundary = findBoundaryIndex(ttsBuffer);
            if (boundary >= minChars) {
              const chunk = ttsBuffer.slice(0, boundary + 1);
              ttsBuffer = ttsBuffer.slice(boundary + 1);
              await sendToEleven(chunk, true);
              continue;
            }
            if (ttsBuffer.length > hardMax) {
              const chunk = ttsBuffer.slice(0, hardMax);
              ttsBuffer = ttsBuffer.slice(hardMax);
              await sendToEleven(chunk, false);
              continue;
            }
            if (force && ttsBuffer.trim().length) {
              const chunk = ttsBuffer;
              ttsBuffer = '';
              await sendToEleven(chunk, true);
            }
            break;
          }
        };

        const processBlock = async (block) => {
          const data = extractSseData(block);
          if (!data) return false;
          if (data === '[DONE]') {
            await flushTtsChunks(true);
            try { ws.send(JSON.stringify({ text: '' })); } catch {}
            await wsFinal;
            sendEvent('[DONE]');
            await closeAll();
            return true;
          }

          let event;
          try { event = JSON.parse(data); } catch { return false; }

          if (event.object === 'thread.run' && event.required_action?.type === 'submit_tool_outputs') {
            for (const call of event.required_action.submit_tool_outputs.tool_calls) {
              if (call.function.name === 'open_activity_card') {
                const args = JSON.parse(call.function.arguments);
                const res = await fetch(`${baseUrl}/api/open-activity-card`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal: requestSignal,
                  body: JSON.stringify({
                    query: args.query,
                    lang: args.lang || selectedLanguage
                  })
                });
                const result = await res.json();

                await fetch(`https://api.openai.com/v1/threads/${tid}/runs/${event.id}/submit_tool_outputs`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  },
                  signal: requestSignal,
                  body: JSON.stringify({
                    tool_outputs: [{
                      tool_call_id: call.id,
                      output: JSON.stringify(result)
                    }]
                  })
                });

                sendEvent({ type: 'tool_call_result', data: result });
              } else if (call.function.name === 'open_menu') {
                const args = JSON.parse(call.function.arguments);
                const res = await fetch(`${baseUrl}/api/open-menu`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal: requestSignal,
                  body: JSON.stringify({
                    category: args.category,
                    recommendations: args.recommendations
                  })
                });
                const result = await res.json();

                await fetch(`https://api.openai.com/v1/threads/${tid}/runs/${event.id}/submit_tool_outputs`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  },
                  signal: requestSignal,
                  body: JSON.stringify({
                    tool_outputs: [{
                      tool_call_id: call.id,
                      output: JSON.stringify(result)
                    }]
                  })
                });

                sendEvent({ type: 'tool_call_result', data: result });
              } else if (call.function.name === 'list_itineraries') {
                const args = JSON.parse(call.function.arguments || '{}');
                const result = await listItineraries({
                  query: args.query,
                  daysMin: args.daysMin,
                  daysMax: args.daysMax,
                  limit: args.limit
                });

                await fetch(`https://api.openai.com/v1/threads/${tid}/runs/${event.id}/submit_tool_outputs`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  },
                  signal: requestSignal,
                  body: JSON.stringify({
                    tool_outputs: [{
                      tool_call_id: call.id,
                      output: JSON.stringify({ itineraries: result })
                    }]
                  })
                });
              } else if (call.function.name === 'open_itinerary') {
                const args = JSON.parse(call.function.arguments || '{}');
                const itinerary = await getItineraryById(args.id);
                const card = itinerary ? buildItineraryCard(itinerary) : { error: 'Itinerario non trovato' };

                await fetch(`https://api.openai.com/v1/threads/${tid}/runs/${event.id}/submit_tool_outputs`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  },
                  signal: requestSignal,
                  body: JSON.stringify({
                    tool_outputs: [{
                      tool_call_id: call.id,
                      output: JSON.stringify(card)
                    }]
                  })
                });

                if (!card?.error) {
                  sendEvent({ type: 'tool_call_result', data: card });
                }
              }
            }
            return false;
          }

          if (event.object === 'thread.message.delta' && event.delta?.content) {
            const delta = event.delta.content
              .filter(i => i.type === 'text')
              .map(i => i.text.value)
              .join('');
            if (delta) {
              ttsBuffer += delta.replace(/[\[\]]/g, '');
              await flushTtsChunks(false);
            }
          }

          sendEvent(event);
          return false;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          openaiBuffer += decoder.decode(value, { stream: true });
          const blocks = openaiBuffer.split(/\r?\n\r?\n/);
          openaiBuffer = blocks.pop();
          for (const b of blocks) {
            const ended = await processBlock(b);
            if (ended) return;
          }
        }

        if (openaiBuffer.trim()) {
          await processBlock(openaiBuffer);
        } else {
          await flushTtsChunks(true);
          try { ws.send(JSON.stringify({ text: '' })); } catch {}
          await wsFinal;
          await closeAll();
        }
      },
      cancel() {
        try { wsOuter?.close(); } catch {}
        wsOuter = null;
        try { reader.cancel(); } catch {}
      }
    });

    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Thread-Id': tid,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Thread-Id'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
