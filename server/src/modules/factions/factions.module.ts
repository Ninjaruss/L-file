import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactionsService } from './factions.service';
import { FactionsController } from './factions.controller';
import { Faction } from '../../entities/faction.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Faction]), MediaModule],
  providers: [FactionsService],
  controllers: [FactionsController],
  exports: [FactionsService],
})
export class FactionsModule {}
