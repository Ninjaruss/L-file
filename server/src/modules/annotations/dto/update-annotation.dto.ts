import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAnnotationDto } from './create-annotation.dto';

export class UpdateAnnotationDto extends PartialType(
  OmitType(CreateAnnotationDto, ['ownerType', 'ownerId'] as const),
) {}
