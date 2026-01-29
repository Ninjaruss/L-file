import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
  ValidateIf,
} from 'class-validator';
import { AnnotationOwnerType } from '../../../entities/annotation.entity';

export class CreateAnnotationDto {
  @ApiProperty({
    description: 'Type of content this annotation belongs to',
    enum: AnnotationOwnerType,
    example: AnnotationOwnerType.CHARACTER,
  })
  @IsEnum(AnnotationOwnerType)
  ownerType: AnnotationOwnerType;

  @ApiProperty({
    description: 'ID of the character, gamble, or arc',
    example: 1,
  })
  @IsInt()
  @Min(1)
  ownerId: number;

  @ApiProperty({
    description: 'Title or summary of the annotation',
    maxLength: 200,
    example: 'Cultural reference to traditional gambling',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Main content of the annotation in markdown format',
    example:
      'This scene references the traditional Japanese gambling practice of...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Optional source URL for citations or references',
    example: 'https://en.wikipedia.org/wiki/Example',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional chapter number for additional context',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  chapterReference?: number;

  @ApiPropertyOptional({
    description: 'Whether this annotation contains spoilers',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSpoiler?: boolean;

  @ApiPropertyOptional({
    description:
      'Chapter number after which the spoiler is revealed (required if isSpoiler is true)',
    example: 150,
  })
  @ValidateIf((o) => o.isSpoiler === true)
  @IsInt()
  @Min(1)
  spoilerChapter?: number;
}
