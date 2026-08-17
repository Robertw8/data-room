import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
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

  generateUploadUrl(key: string, contentType: string) {
    const putObject = new PutObjectCommand({
      Key: key,
      ContentType: contentType,
      Bucket: this.bucket,
    });

    return getSignedUrl(this.s3, putObject, { expiresIn: 300 });
  }

  getObjectMetadata(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return this.s3.send(command);
  }

  generateDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, {
      expiresIn: 300,
    });
  }

  deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return this.s3.send(command);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    for (let index = 0; index < keys.length; index += 1000) {
      const chunk = keys.slice(index, index + 1000);
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
        },
      });

      const response = await this.s3.send(command);

      if (response.Errors?.length) {
        throw new Error('Failed to delete some objects from S3.');
      }
    }
  }
}
