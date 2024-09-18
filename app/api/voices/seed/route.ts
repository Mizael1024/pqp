import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';

const sampleVoices = [
  {
    name: "Adam",
    voice_id: "adam123",
    type: "ElevenLabs",
    visibility: "public",
    preview_url: "https://example.com/adam_preview.mp3"
  },
  {
    name: "Eva",
    voice_id: "eva456",
    type: "ElevenLabs",
    visibility: "public",
    preview_url: "https://example.com/eva_preview.mp3"
  },
  {
    name: "Voz Personalizada",
    voice_id: "custom789",
    type: "Cloned",
    visibility: "private",
    preview_url: null,
    user_id: 1 // Supondo que exista um usuário com ID 1
  }
];

export async function GET() {
  try {
    console.log('Iniciando seed de vozes...');
    for (const voice of sampleVoices) {
      await db.insert(voices).values(voice);
    }
    console.log('Seed de vozes concluído com sucesso.');
    return NextResponse.json({ message: 'Vozes de exemplo adicionadas com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar vozes de exemplo:', error);
    return NextResponse.json({ error: 'Erro ao adicionar vozes de exemplo' }, { status: 500 });
  }
}