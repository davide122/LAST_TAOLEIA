import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { text, language = 'it' } = await req.json();
    
    // Recupera la lingua dal header x-selected-language se presente
    let selectedLanguage = language;
    try {
      const headers = req.headers;
      if (headers.has('x-selected-language')) {
        selectedLanguage = headers.get('x-selected-language');
      }
    } catch (err) {
      console.error('Errore nel recupero della lingua dall\'header:', err);
    }
    const key = process.env.ELEVENLABS_API_KEY;
    
    // Seleziona la voce in base alla lingua
    let voiceId;
    if (selectedLanguage === 'it') {
      // Usa la voce specifica per l'italiano
      voiceId = process.env.ELEVENLABS_VOICE_ID_IT || process.env.ELEVENLABS_VOICE_ID;
    } else {
      // Usa la voce comune per tutte le altre lingue
      voiceId = process.env.ELEVENLABS_VOICE_ID_OTHER || process.env.ELEVENLABS_VOICE_ID;
    }
    
    if (!key || !voiceId) throw new Error('Mancano ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID');

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key':   key
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          stream:   false,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.8,
            use_speaker_boost: true
          }
        })
      }
    );
    if (!elevenRes.ok) {
      const txt = await elevenRes.text();
      throw new Error(`ElevenLabs TTS error: ${elevenRes.status} – ${txt}`);
    }

    // Proxy del flusso audio
    return new Response(elevenRes.body, {
      headers: {
        'Content-Type':                'audio/mpeg',
        'Cache-Control':               'no-cache',
        'Connection':                  'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('ElevenLabs TTS error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
