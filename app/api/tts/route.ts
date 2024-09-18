import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, voice_id } = await req.json();

  if (!text || !voice_id) {
    return NextResponse.json({ error: 'Texto e ID da voz são necessários' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Chave de API não configurada' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao converter texto em fala');
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Erro ao converter texto em fala:', error);
    return NextResponse.json({ error: 'Erro ao converter texto em fala' }, { status: 500 });
  }
}