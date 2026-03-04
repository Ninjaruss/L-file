import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class CloudflareR2Service {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private s3Client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): S3Client {
    if (!this.s3Client) {
      const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
      const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'R2_SECRET_ACCESS_KEY',
      );

      if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new InternalServerErrorException('R2 credentials not configured');
      }

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    return this.s3Client;
  }

  private get bucketName(): string {
    const name = this.configService.get<string>('R2_BUCKET_NAME');
    if (!name) {
      throw new InternalServerErrorException('R2_BUCKET_NAME not configured');
    }
    return name;
  }

  private get publicUrl(): string {
    const url = this.configService.get<string>('R2_PUBLIC_URL');
    if (!url) {
      throw new InternalServerErrorException('R2_PUBLIC_URL not configured');
    }
    return url.replace(/\/$/, '');
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'media',
  ): Promise<{ fileId: string; fileName: string; url: string; key: string }> {
    if (!file || file.length === 0) {
      throw new BadRequestException('File is required');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.length > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        'Only image files (JPEG, PNG, WebP, GIF) are allowed',
      );
    }

    const key = `${folder}/${fileName}`;
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(
            `Retry attempt ${attempt + 1}/${maxRetries} for ${fileName}`,
          );
        }

        await this.getClient().send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
            ContentLength: file.length,
          }),
        );

        const url = `${this.publicUrl}/${key}`;
        this.logger.log(`Successfully uploaded ${key} to R2`);

        return {
          fileId: key, // R2 doesn't issue numeric fileIds; use key
          fileName: key,
          url,
          key,
        };
      } catch (error: any) {
        lastError = error;

        const statusCode = error.$metadata?.httpStatusCode;
        const isRetryable =
          statusCode === 503 ||
          statusCode === 500 ||
          statusCode === 408 ||
          !statusCode; // network errors

        if (!isRetryable || attempt === maxRetries - 1) {
          break;
        }

        const backoffMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(
          `Upload attempt ${attempt + 1} failed with ${statusCode ?? 'network error'}, retrying in ${backoffMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    this.logger.error(
      `Failed to upload file to R2 after ${maxRetries} attempts`,
      lastError,
    );
    throw new InternalServerErrorException(
      'Failed to upload file. Please try again later.',
    );
  }

  async safeDeleteFile(key: string): Promise<void> {
    try {
      await this.deleteFile(key);
    } catch (error) {
      this.logger.error(`Error during safe deletion of ${key} from R2`, error);
      // Don't throw - allow cleanup to continue
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.getClient().send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Successfully deleted ${key} from R2`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key} from R2`, error);
      // Don't throw - consistent with B2 service behavior
    }
  }

  generateSignedUrl(
    fileName: string,
    _expiresInSeconds: number = 3600,
  ): string {
    // R2 public files don't need signed URLs; return the public URL directly
    return `${this.publicUrl}/${fileName}`;
  }
}
