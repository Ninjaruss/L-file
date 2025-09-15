import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [BadgesModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
