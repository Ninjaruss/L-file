import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterRelationshipsService } from './character-relationships.service';
import { CharacterRelationshipsController } from './character-relationships.controller';
import { CharacterRelationship } from '../../entities/character-relationship.entity';
import { Character } from '../../entities/character.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([CharacterRelationship, Character]), EditLogModule],
  providers: [CharacterRelationshipsService],
  controllers: [CharacterRelationshipsController],
  exports: [CharacterRelationshipsService],
})
export class CharacterRelationshipsModule {}
