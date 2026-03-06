import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditLog } from '../../entities/edit-log.entity';
import { Guide } from '../../entities/guide.entity';
import { Media } from '../../entities/media.entity';
import { Annotation } from '../../entities/annotation.entity';
import { EditLogService } from './edit-log.service';
import { EditLogController } from './edit-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EditLog, Guide, Media, Annotation])],
  controllers: [EditLogController],
  providers: [EditLogService],
  exports: [EditLogService],
})
export class EditLogModule {}
