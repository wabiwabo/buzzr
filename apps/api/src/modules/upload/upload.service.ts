import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PRESIGNED_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class UploadService {
  private readonly minioClient: Client;
  private readonly bucketPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });

    this.bucketPrefix = this.configService.get<string>('MINIO_BUCKET_PREFIX', 'buzzr');
  }

  async uploadFile(
    tenantSchema: string,
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipe file tidak diizinkan. Hanya JPG, PNG, GIF, dan WebP yang diperbolehkan.',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Ukuran file maksimal 5MB.');
    }

    const bucketName = this.getBucketName(tenantSchema);
    await this.ensureBucket(bucketName);

    const key = `${folder}/${randomUUID()}-${file.originalname}`;

    await this.minioClient.putObject(
      bucketName,
      key,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const url = await this.minioClient.presignedGetObject(
      bucketName,
      key,
      PRESIGNED_URL_EXPIRY,
    );

    return { url, key };
  }

  async getPresignedUrl(tenantSchema: string, key: string): Promise<string> {
    const bucketName = this.getBucketName(tenantSchema);
    return this.minioClient.presignedGetObject(
      bucketName,
      key,
      PRESIGNED_URL_EXPIRY,
    );
  }

  async deleteFile(tenantSchema: string, key: string): Promise<void> {
    const bucketName = this.getBucketName(tenantSchema);
    await this.minioClient.removeObject(bucketName, key);
  }

  private getBucketName(tenantSchema: string): string {
    return `${this.bucketPrefix}-${tenantSchema}`;
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName);
    }
  }
}
