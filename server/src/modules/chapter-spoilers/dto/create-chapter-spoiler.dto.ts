import { IsEnum, IsString, IsNumber, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpoilerLevel, SpoilerCategory, ChapterReference } from '../../../entities/chapter-spoiler.entity';

export class ChapterReferenceDto {
  @ApiProperty({ description: 'Chapter number', example: 10 })
  @IsNumber()
  chapterNumber: number;

  @ApiProperty({ description: 'Context or page reference', example: 'Page 8 - Character background revealed' })
  @IsString()
  context: string;
}

export class CreateChapterSpoilerDto {
  @ApiPropertyOptional({ description: 'Associated event ID', example: 1 })
  @IsNumber()
  @IsOptional()
  eventId?: number;

  @ApiProperty({ description: 'Chapter number where this spoiler occurs', example: 15 })
  @IsNumber()
  chapterNumber: number;

  @ApiProperty({ description: 'Severity level of the spoiler', enum: SpoilerLevel, example: SpoilerLevel.REVEAL })
  @IsEnum(SpoilerLevel)
  level: SpoilerLevel;

  @ApiProperty({ description: 'Category of the spoiler', enum: SpoilerCategory, example: SpoilerCategory.PLOT })
  @IsEnum(SpoilerCategory)
  category: SpoilerCategory;

  @ApiProperty({ description: 'Spoiler content description', example: 'A major character revelation occurs during the final gamble' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ 
    description: 'List of chapter references with context for additional reading',
    type: [ChapterReferenceDto],
    example: [
      { chapterNumber: 10, context: "Page 8 - Character background revealed" },
      { chapterNumber: 12, context: "Final scene - Important foreshadowing" }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterReferenceDto)
  @IsOptional()
  chapterReferences?: ChapterReference[];

  @ApiPropertyOptional({ description: 'Whether this spoiler has been verified by moderators', example: true })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
