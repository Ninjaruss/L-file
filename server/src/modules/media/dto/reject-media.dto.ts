import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RejectMediaDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Content does not meet quality standards',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
