import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../../../entities/event.entity';

export class FilterEventsDto {
  @IsEnum(EventType)
  @IsOptional()
  @ApiPropertyOptional({ enum: EventType, description: 'Filter by event type' })
  type?: EventType;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Filter by arc ID' })
  arcId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Filter by gamble ID' })
  gambleId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Filter by chapter number' })
  chapterNumber?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Filter by character ID' })
  characterId?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search title and description' })
  search?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'User reading progress for spoiler protection',
  })
  userProgress?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number (default: 1)', default: 1 })
  page?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Items per page (default: 20)',
    default: 20,
  })
  limit?: number;

  @IsEnum(['chapterNumber', 'createdAt'])
  @IsOptional()
  @ApiPropertyOptional({
    enum: ['chapterNumber', 'createdAt'],
    description: 'Sort field (default: chapterNumber)',
  })
  sort?: 'chapterNumber' | 'createdAt';

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: ASC)',
  })
  order?: 'ASC' | 'DESC';
}
