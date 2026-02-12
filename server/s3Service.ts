import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// AWS Configuration with fallback values
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'AKIAZDLN3HTIH4JFRNE2';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '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';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'digquest-images';

// Log credential status on startup
console.log('🔑 AWS S3 Configuration:');
console.log('   Region:', AWS_REGION);
console.log('   Bucket:', BUCKET_NAME);
console.log('   Access Key ID:', AWS_ACCESS_KEY_ID ? AWS_ACCESS_KEY_ID.substring(0, 10) + '...' : 'NOT SET');
console.log('   Secret Key:', AWS_SECRET_ACCESS_KEY ? 'SET (length: ' + AWS_SECRET_ACCESS_KEY.length + ')' : 'NOT SET');
console.log('   Using environment variables:', process.env.AWS_ACCESS_KEY_ID ? 'YES ✅' : 'NO - using hardcoded fallback ⚠️');

// Warn if using fallback credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ WARNING: Using hardcoded AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables for production.');
  console.warn('   Current credentials may be invalid or have insufficient permissions.');
}

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
    console.log('S3 Config:', { region: AWS_REGION, bucket: BUCKET_NAME, accessKeyId: AWS_ACCESS_KEY_ID.substring(0, 8) + '...' });
    
    // Validate credentials
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || AWS_ACCESS_KEY_ID.length < 16) {
      throw new Error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
    
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

    // Try with public-read ACL first
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read',
      });

      console.log('Sending S3 command with public-read ACL for key:', key);
      await s3Client.send(command);
    } catch (aclError) {
      // If ACL fails (bucket has ACLs disabled), try without ACL
      console.warn('⚠️ ACL upload failed, trying without ACL:', aclError.message);
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      console.log('Sending S3 command without ACL for key:', key);
      await s3Client.send(command);
    }

    const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    console.log('S3 upload successful, URL:', url);
    console.log('Testing URL accessibility...');
    console.log('⚠️ IMPORTANT: If images don\'t display, you need to configure CORS on the S3 bucket!');
    console.log('   See: AWS_S3_CORS_SETUP.md for instructions');
    
    // Test if the URL is accessible
    try {
      const testResponse = await fetch(url, { method: 'HEAD' });
      console.log('URL test response status:', testResponse.status);
      if (!testResponse.ok) {
        console.warn('⚠️ Uploaded image may not be publicly accessible. Status:', testResponse.status);
        console.warn('   Check both: 1) Bucket public access settings, 2) CORS configuration');
      } else {
        console.log('✅ Image URL is publicly accessible from server');
        console.log('   If browsers still can\'t load it, configure CORS!');
      }
    } catch (testError) {
      console.warn('⚠️ Could not verify image URL accessibility:', testError.message);
    }

    return { key, url };
  } catch (error: any) {
    console.error('❌ S3 upload error details:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.Code || error.$metadata?.httpStatusCode);
    
    // Provide more specific error messages based on AWS error types
    let errorMessage = 'S3 upload failed: ';
    
    if (error.name === 'InvalidAccessKeyId') {
      errorMessage += 'Invalid AWS Access Key ID. Check your AWS_ACCESS_KEY_ID environment variable.';
    } else if (error.name === 'SignatureDoesNotMatch') {
      errorMessage += 'Invalid AWS Secret Access Key. Check your AWS_SECRET_ACCESS_KEY environment variable.';
    } else if (error.name === 'NoSuchBucket') {
      errorMessage += `Bucket "${BUCKET_NAME}" does not exist. Create it in AWS S3 or check the bucket name.`;
    } else if (error.name === 'AccessDenied') {
      errorMessage += 'Access denied. IAM user needs s3:PutObject and s3:PutObjectAcl permissions.';
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error occurred.';
    }
    
    throw new Error(errorMessage);
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