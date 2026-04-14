import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Character]), EditLogModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
