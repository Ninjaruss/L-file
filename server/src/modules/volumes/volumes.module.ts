import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumesController } from './volumes.controller';
import { VolumesService } from './volumes.service';
import { Volume } from '../../entities/volume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Volume])],
  controllers: [VolumesController],
  providers: [VolumesService],
  exports: [VolumesService],
})
export class VolumesModule {}
