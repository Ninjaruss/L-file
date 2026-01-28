import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Annotation } from '../../entities/annotation.entity';
import { User } from '../../entities/user.entity';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Arc } from '../../entities/arc.entity';
import { AnnotationsController } from './annotations.controller';
import { AnnotationsService } from './annotations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Annotation,
      User,
      Character,
      Gamble,
      Chapter,
      Arc,
    ]),
  ],
  controllers: [AnnotationsController],
  providers: [AnnotationsService],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
