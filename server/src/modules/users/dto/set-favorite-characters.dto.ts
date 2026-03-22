import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FavoriteCharacterItemDto {
  @ApiProperty({ description: 'Character ID', example: 1 })
  @IsInt()
  @Min(1)
  characterId: number;

  @ApiProperty({
    description: 'Whether this is the primary favorite',
    example: true,
  })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({
    description: 'Display order (1-5)',
    example: 1,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  sortOrder: number;
}

export class SetFavoriteCharactersDto {
  @ApiProperty({
    description:
      'List of favorite characters (max 5). Exactly one must have isPrimary=true.',
    type: [FavoriteCharacterItemDto],
  })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => FavoriteCharacterItemDto)
  favorites: FavoriteCharacterItemDto[];
}
