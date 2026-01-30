import {
  Injectable,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as imageSize from 'image-size';

interface ValidationResult {
  isValid: boolean;
  mimeType: string;
  width?: number;
  height?: number;
  error?: string;
}

@Injectable()
export class FileValidationService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly MAGIC_NUMBERS = {
    jpeg: Buffer.from([0xff, 0xd8, 0xff]),
    png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    gif: Buffer.from([0x47, 0x49, 0x46, 0x38]),
    webp: {
      riff: Buffer.from([0x52, 0x49, 0x46, 0x46]),
      webp: Buffer.from([0x57, 0x45, 0x42, 0x50]),
    },
  };

  /**
   * Validate uploaded file: size, magic bytes, MIME type
   */
  async validateFile(
    file: Express.Multer.File,
    claimedMimeType?: string,
  ): Promise<ValidationResult> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Detect actual MIME type from magic bytes
    const detectedMimeType = this.detectMimeTypeFromMagicBytes(file.buffer);

    if (!detectedMimeType) {
      throw new UnsupportedMediaTypeException(
        'Unsupported file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
      );
    }

    // Verify claimed MIME type matches detected type (if provided)
    if (claimedMimeType && claimedMimeType !== detectedMimeType) {
      throw new BadRequestException(
        `File type mismatch: claimed ${claimedMimeType}, but detected ${detectedMimeType}`,
      );
    }

    // Check against whitelist
    if (!this.ALLOWED_MIME_TYPES.includes(detectedMimeType)) {
      throw new UnsupportedMediaTypeException(
        `File type ${detectedMimeType} is not allowed. Only JPEG, PNG, WebP, and GIF images are supported.`,
      );
    }

    // Extract image dimensions
    let dimensions: { width?: number; height?: number } = {};
    try {
      const size = imageSize.imageSize(file.buffer);
      dimensions = {
        width: size.width,
        height: size.height,
      };
    } catch (error) {
      // If dimension extraction fails, log but don't fail validation
      console.warn('Failed to extract image dimensions:', error.message);
    }

    return {
      isValid: true,
      mimeType: detectedMimeType,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  /**
   * Detect MIME type by checking magic bytes
   */
  private detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
    // Check JPEG (FF D8 FF)
    if (buffer.subarray(0, 3).equals(this.MAGIC_NUMBERS.jpeg)) {
      return 'image/jpeg';
    }

    // Check PNG (89 50 4E 47 0D 0A 1A 0A)
    if (buffer.subarray(0, 8).equals(this.MAGIC_NUMBERS.png)) {
      return 'image/png';
    }

    // Check GIF (47 49 46 38)
    if (buffer.subarray(0, 4).equals(this.MAGIC_NUMBERS.gif)) {
      return 'image/gif';
    }

    // Check WebP (RIFF at bytes 0-3, WEBP at bytes 8-11)
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(this.MAGIC_NUMBERS.webp.riff) &&
      buffer.subarray(8, 12).equals(this.MAGIC_NUMBERS.webp.webp)
    ) {
      return 'image/webp';
    }

    return null;
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    return mimeToExt[mimeType] || 'bin';
  }
}
