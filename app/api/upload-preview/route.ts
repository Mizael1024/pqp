import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.DO_REGION,
  endpoint: process.env.DO_SPACE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DO_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const voiceId = formData.get('voiceId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${voiceId}-${uuidv4()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACE_NAME,
      Key: fileName,
      Body: buffer,
      ACL: 'public-read',
      ContentType: file.type,
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.DO_SPACE_NAME}.${process.env.DO_REGION}.digitaloceanspaces.com/${fileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
  }
}