import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guide } from '../../entities/guide.entity';
import { Media } from '../../entities/media.entity';
import { Annotation } from '../../entities/annotation.entity';
import { Quote } from '../../entities/quote.entity';
import { User } from '../../entities/user.entity';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guide, Media, Annotation, Quote, User]),
    EditLogModule,
  ],
  controllers: [ContributionsController],
  providers: [ContributionsService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
