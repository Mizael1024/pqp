import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';

async function fetchElevenLabsVoices() {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar vozes do ElevenLabs');
  }

  return response.json();
}

export async function GET() {
  try {
    console.log('Iniciando sincronização de vozes...');
    const elevenLabsVoices = await fetchElevenLabsVoices();

    for (const voice of elevenLabsVoices.voices) {
      await db.insert(voices).values({
        name: voice.name,
        voice_id: voice.voice_id,
        type: 'ElevenLabs',
        visibility: 'public',
        // Não importamos o preview_url aqui
      }).onConflictDoUpdate({
        target: voices.voice_id,
        set: {
          name: voice.name,
          // Também não atualizamos o preview_url aqui
        },
      });
    }

    console.log('Sincronização de vozes concluída com sucesso.');
    return NextResponse.json({ message: 'Vozes sincronizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao sincronizar vozes:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar vozes' }, { status: 500 });
  }
}