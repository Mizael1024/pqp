import { NextResponse } from 'next/server';
import axios from 'axios';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Chave da API não configurada' }, { status: 500 });
  }
  
  try {
    const response = await axios.delete(`https://api.elevenlabs.io/v1/history/${id}`, {
      headers: {
        'xi-api-key': apiKey,
      },
      timeout: 5000, // 5 segundos de timeout
    });

    return NextResponse.json({ success: true, status: response.status });
  } catch (error) {
    console.error('Erro ao excluir áudio:', error);
    return NextResponse.json({ error: 'Erro ao excluir áudio' }, { status: 500 });
  }
}