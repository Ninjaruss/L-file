import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectAnnotationDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Content does not meet quality standards or contains inaccuracies',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;
}
