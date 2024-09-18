import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { voices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const updatedVoice = await db.update(voices)
      .set({
        name: body.name,
        visibility: body.visibility,
        preview_url: body.preview_url,
      })
      .where(eq(voices.id, id))
      .returning();

    if (updatedVoice.length === 0) {
      return NextResponse.json({ error: 'Voz não encontrada' }, { status: 404 });
    }

    return NextResponse.json(updatedVoice[0]);
  } catch (error) {
    console.error('Erro ao atualizar voz:', error);
    return NextResponse.json({ error: 'Erro ao atualizar voz' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const deletedVoice = await db.delete(voices)
      .where(eq(voices.id, id))
      .returning();

    if (deletedVoice.length === 0) {
      return NextResponse.json({ error: 'Voz não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Voz excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir voz:', error);
    return NextResponse.json({ error: 'Erro ao excluir voz' }, { status: 500 });
  }
}