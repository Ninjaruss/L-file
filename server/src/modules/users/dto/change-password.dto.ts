import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description:
      'Current password (required if the account already has a password; omit when setting a password for the first time on a Fluxer-only account)',
    example: 'MyCurrentPassword1',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description:
      'New password (8–128 characters, must contain uppercase, lowercase, and a number)',
    example: 'MyNewPassword1',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  newPassword: string;
}
