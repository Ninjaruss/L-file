import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { RelationshipType } from '../../../entities/character-relationship.entity';

export class CreateCharacterRelationshipDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'ID of the source character (who has the relationship)',
    example: 1,
  })
  sourceCharacterId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'ID of the target character (toward whom)',
    example: 2,
  })
  targetCharacterId: number;

  @IsEnum(RelationshipType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of relationship',
    enum: RelationshipType,
    example: RelationshipType.RIVAL,
  })
  relationshipType: RelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Short description of the relationship',
    example: 'Met during the Labyrinth game',
    maxLength: 1000,
  })
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({
    description: 'Chapter where this relationship begins or is revealed',
    example: 15,
  })
  startChapter: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Chapter where this relationship ends (null if ongoing)',
    example: 100,
  })
  endChapter?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description:
      'Chapter the user should have read before seeing this (defaults to startChapter)',
    example: 14,
  })
  spoilerChapter?: number;

  @IsEnum(RelationshipType)
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'If provided, creates a reverse relationship (target → source) with this type. Use same value as relationshipType for symmetric relationships.',
    enum: RelationshipType,
    example: RelationshipType.RIVAL,
  })
  reverseRelationshipType?: RelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description:
      'Description for the reverse relationship. If not provided, uses the same description.',
    example: 'Views them as a worthy opponent',
    maxLength: 1000,
  })
  reverseDescription?: string;
}
