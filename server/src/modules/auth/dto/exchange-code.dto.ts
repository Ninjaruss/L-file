import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeCodeDto {
  @ApiProperty({
    description: 'One-time authorization code from OAuth callback',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
