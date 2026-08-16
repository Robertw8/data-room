import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    const putObject = new PutObjectCommand({
      Key: key,
      ContentType: contentType,
      Bucket: this.bucket,
    });

    return getSignedUrl(this.s3, putObject, { expiresIn: 300 });
  }
}
