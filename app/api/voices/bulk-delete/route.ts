import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function DELETE(request: Request) {
  try {
    const { voiceIds } = await request.json();

    await db.delete(voices)
      .where(inArray(voices.id, voiceIds));

    return NextResponse.json({ message: 'Vozes excluídas com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vozes em massa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}