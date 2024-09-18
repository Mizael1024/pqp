import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';

export async function GET() {
  try {
    // Busca todas as vozes, sem filtrar por visibilidade
    const allVoices = await db.select().from(voices);

    return NextResponse.json({ voices: allVoices });
  } catch (error) {
    console.error('Erro ao buscar vozes:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}