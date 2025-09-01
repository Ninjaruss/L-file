import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({
    description: "Character's primary name",
    example: 'Baku Madarame',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Alternative names or aliases',
    example: ['The Emperor', 'Death God'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10) // Reasonable limit for alternate names
  @MaxLength(100, { each: true })
  alternateNames?: string[];

  @ApiPropertyOptional({
    description: 'Character description',
    example: 'A professional gambler known for taking on dangerous bets.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000) // Reasonable limit for description
  description?: string;

  @ApiPropertyOptional({
    description: 'First chapter appearance number',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  firstAppearanceChapter?: number;

  @ApiPropertyOptional({
    description: 'Notable roles or positions',
    example: ['Kakerou Company CEO', 'Professional Gambler'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @MaxLength(200, { each: true })
  notableRoles?: string[];

  @ApiPropertyOptional({
    description: 'Notable games participated in',
    example: ['17 Steps', 'One-Card Poker'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(30)
  @MaxLength(200, { each: true })
  notableGames?: string[];

  @ApiPropertyOptional({
    description: "Character's occupation or profession",
    example: 'Professional Gambler',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Organizations or groups the character is affiliated with',
    example: ['Kakerou Company', 'Tournament Committee'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(15)
  @MaxLength(200, { each: true })
  affiliations?: string[];

  @ApiPropertyOptional({
    description: 'IDs of factions the character belongs to',
    type: [Number],
    example: [1, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  factionIds?: number[];
}
