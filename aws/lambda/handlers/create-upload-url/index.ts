import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { getAuthClaims } from '../../shared/auth';
import { ok, badRequest, serverError } from '../../shared/response';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as { category?: string; contentType?: string };
    const category = body.category === 'pet' ? 'pet' : 'space';
    const bucket = category === 'pet'
      ? process.env['PET_PHOTOS_BUCKET']!
      : process.env['SPACE_PHOTOS_BUCKET']!;
    const contentType = body.contentType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType))
      return badRequest('Invalid content type');

    const key = `${sub}/${randomUUID()}.${contentType.split('/')[1]}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    const region = process.env['AWS_REGION'] ?? process.env['AWS_DEFAULT_REGION'] ?? 'us-east-1';
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return ok({ url, key, publicUrl });
  } catch (err) {
    return serverError(err);
  }
}
