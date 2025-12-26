import { PartialType } from '@nestjs/swagger';
import { CreateCharacterRelationshipDto } from './create-character-relationship.dto';

export class UpdateCharacterRelationshipDto extends PartialType(
  CreateCharacterRelationshipDto,
) {}
