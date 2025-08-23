import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterSpoilersService } from './chapter-spoilers.service';
import { ChapterSpoilersController } from './chapter-spoilers.controller';
import { ChapterSpoiler } from '../../entities/chapter-spoiler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterSpoiler])],
  providers: [ChapterSpoilersService],
  controllers: [ChapterSpoilersController],
})
export class ChapterSpoilersModule {}
