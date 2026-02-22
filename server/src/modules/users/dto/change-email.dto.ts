import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'New email must be a valid email address' })
  newEmail: string;

  @ApiPropertyOptional({
    description:
      'Current account password (required for email/password accounts; omit for Fluxer-only accounts)',
    example: 'MyCurrentPassword1',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
