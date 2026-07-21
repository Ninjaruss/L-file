import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BadgeType } from '../../../entities/badge.entity';

export class CreateBadgeDto {
  @ApiProperty({ description: 'Badge name (unique)', example: 'Supporter' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Badge description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Badge type',
    enum: BadgeType,
    default: BadgeType.CUSTOM,
  })
  @IsOptional()
  @IsEnum(BadgeType)
  type?: BadgeType;

  @ApiProperty({
    description: 'Badge icon (emoji or image path)',
    example: '💎',
  })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({ description: 'Badge color (hex code)', example: '#FFD700' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiPropertyOptional({ description: 'Badge background color (hex code)' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Display order/priority', example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the badge is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the badge can be manually awarded by admins',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isManuallyAwardable?: boolean;
}

export class UpdateBadgeDto extends PartialType(CreateBadgeDto) {}
