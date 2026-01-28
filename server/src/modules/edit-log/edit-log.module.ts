import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditLog } from '../../entities/edit-log.entity';
import { EditLogService } from './edit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([EditLog])],
  providers: [EditLogService],
  exports: [EditLogService],
})
export class EditLogModule {}
