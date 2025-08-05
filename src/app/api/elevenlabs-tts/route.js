import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { text, language = 'it' } = await req.json();
    
    // Debug logging
    console.log('TTS Request:', { text: text.substring(0, 100) + '...', language });
    
    const key = process.env.ELEVENLABS_API_KEY;
    
    // Seleziona la voce in base alla lingua
    let voiceId;
    switch (language) {
      case 'en':
        voiceId = process.env.ELEVENLABS_VOICE_ID_EN || process.env.ELEVENLABS_VOICE_ID;
        break;
      case 'fr':
        voiceId = process.env.ELEVENLABS_VOICE_ID_FR || process.env.ELEVENLABS_VOICE_ID;
        break;
      case 'es':
        voiceId = process.env.ELEVENLABS_VOICE_ID_ES || process.env.ELEVENLABS_VOICE_ID;
        break;
      case 'de':
        voiceId = process.env.ELEVENLABS_VOICE_ID_DE || process.env.ELEVENLABS_VOICE_ID;
        break;
      case 'it':
      default:
        voiceId = process.env.ELEVENLABS_VOICE_ID;
        break;
    }
    
    if (!key || !voiceId) throw new Error('Mancano ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID');
    
    console.log('Using voice ID:', voiceId, 'for language:', language);

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key':   key
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_flash_v2_5',
          stream: false,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.8,
            use_speaker_boost: true
          },
          pronunciation_dictionary_locators: [],
          seed: null,
          previous_text: null,
          next_text: null,
          previous_request_ids: [],
          next_request_ids: []
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
