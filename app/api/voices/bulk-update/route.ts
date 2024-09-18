import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function PUT(request: Request) {
  try {
    const { voiceIds, visibility } = await request.json();

    await db.update(voices)
      .set({ visibility })
      .where(inArray(voices.id, voiceIds));

    return NextResponse.json({ message: 'Vozes atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar vozes em massa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}