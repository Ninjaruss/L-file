import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';
import { EventType } from '../../../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({ description: 'Event title', example: 'The 17 Steps Tournament' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  @ApiProperty({ description: 'Event description' })
  description: string;

  @IsEnum(EventType)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Type of event', enum: EventType, default: EventType.DECISION })
  type?: EventType;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Chapter number where this event occurs', example: 45 })
  chapterNumber: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number within the chapter', example: 14 })
  pageNumber?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Chapter number required before showing this event (spoiler protection)', example: 44 })
  spoilerChapter?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'ID of the arc this event belongs to', example: 1 })
  arcId?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'ID of the gamble associated with this event', example: 1 })
  gambleId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @ApiPropertyOptional({ description: 'IDs of characters involved in this event', type: [Number], example: [1, 3, 5] })
  characterIds?: number[];
}
