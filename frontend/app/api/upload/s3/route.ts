import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucketName = process.env.AWS_S3_BUCKET!;
    const region = process.env.AWS_REGION!;

    if (!bucketName || !region) {
      return NextResponse.json({ error: 'S3 Configuration missing in .env.local' }, { status: 500 });
    }
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct the public URL
    // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${path}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to S3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
