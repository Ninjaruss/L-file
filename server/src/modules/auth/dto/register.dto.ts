import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the new account (3–30 characters)',
    example: 'johndoe',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  username: string;

  @ApiProperty({
    description: 'Email address for the new account',
    example: 'john@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description:
      'Password (8–128 characters, must contain uppercase, lowercase, and a number)',
    example: 'MySecurePassword1',
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
  password: string;
}
