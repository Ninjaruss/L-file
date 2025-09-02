import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageView } from '../../entities/page-view.entity';
import { PageViewsController } from './page-views.controller';
import { PageViewsService } from './page-views.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageView])],
  controllers: [PageViewsController],
  providers: [PageViewsService],
  exports: [PageViewsService],
})
export class PageViewsModule {}
