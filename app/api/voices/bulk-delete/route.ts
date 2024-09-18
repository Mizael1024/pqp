import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function DELETE(request: Request) {
  try {
    const { voiceIds } = await request.json();

    if (!Array.isArray(voiceIds) || voiceIds.length === 0) {
      return NextResponse.json({ error: 'IDs de voz inválidos' }, { status: 400 });
    }

    const result = await db.delete(voices)
      .where(inArray(voices.id, voiceIds));

    if (result.length === 0) {
      return NextResponse.json({ message: 'Nenhuma voz encontrada para exclusão' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Vozes excluídas com sucesso', count: result.length });
  } catch (error) {
    console.error('Erro ao excluir vozes em massa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}