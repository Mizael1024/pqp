import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const response = await axios.get(`https://api.elevenlabs.io/v1/history/${id}/audio`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    const audioBuffer = Buffer.from(response.data, 'binary');
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="audio_${id}.mp3"`,
      },
    });
  } catch (error) {
    console.error('Erro ao baixar áudio:', error);
    return NextResponse.json({ error: 'Erro ao baixar áudio' }, { status: 500 });
  }
}