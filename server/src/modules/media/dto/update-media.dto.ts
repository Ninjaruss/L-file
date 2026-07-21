import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateMediaDto } from './create-media.dto';
import { MediaStatus } from '../../../entities/media.entity';

/**
 * Validated payload for admin media edits. Extends the create fields (all
 * optional) and additionally allows the moderation status/rejection reason.
 * Typing the controller body with this DTO makes the global ValidationPipe
 * validate media updates (the handlers previously used `any`, bypassing it).
 */
export class UpdateMediaDto extends PartialType(CreateMediaDto) {
  @ApiPropertyOptional({ description: 'Moderation status', enum: MediaStatus })
  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @ApiPropertyOptional({ description: 'Reason shown when status is rejected' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
