import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGambleDto {
  @ApiProperty({
    description: 'Name of the gamble/game',
    example: 'One-Card Poker Death Match',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed rules of the game',
    example:
      'Each player draws one card from a standard deck. The player with the higher card wins. Aces are high. In case of a tie, new cards are drawn.',
  })
  @IsString()
  rules: string;

  @ApiPropertyOptional({
    description: 'Specific win condition if different from basic rules',
    example: 'First player to win 3 rounds claims final victory',
  })
  @IsOptional()
  @IsString()
  winCondition?: string;

  @ApiProperty({
    description: 'ID of the chapter where this gamble occurs',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  chapterId: number;

  @ApiPropertyOptional({
    description: 'Array of character IDs who participated in this gamble',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];
}