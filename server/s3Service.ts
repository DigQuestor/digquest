import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// AWS Configuration with fallback values
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'AKIAZDLN3HTIH4JFRNE2';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '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';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'digquest-images';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    console.log('S3 Upload starting:', { originalName, mimeType, folder, bufferSize: fileBuffer.length });
    console.log('S3 Config:', { region: AWS_REGION, bucket: BUCKET_NAME });
    
    // Validate originalName before using path.extname
    if (!originalName || typeof originalName !== 'string') {
      console.error('Invalid originalName provided:', originalName);
      throw new Error('Invalid file name provided');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName) || '.jpg'; // fallback to .jpg if no extension
    const key = `${folder}/${timestamp}-${randomString}${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    console.log('Sending S3 command for key:', key);
    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    console.log('S3 upload successful, URL:', url);

    return { key, url };
  } catch (error) {
    console.error('S3 upload error details:', error);
    throw error;
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}