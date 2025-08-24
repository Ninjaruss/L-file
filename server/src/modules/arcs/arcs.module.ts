import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcsService } from './arcs.service';
import { ArcsController } from './arcs.controller';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Arc, Chapter])],
  providers: [ArcsService],
  controllers: [ArcsController],
})
export class ArcsModule {}
