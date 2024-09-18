import { NextResponse } from 'next/server';
import axios from 'axios';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    await axios.delete(`https://api.elevenlabs.io/v1/history/${id}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir áudio:', error);
    return NextResponse.json({ error: 'Erro ao excluir áudio' }, { status: 500 });
  }
}