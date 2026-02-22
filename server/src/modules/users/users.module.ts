import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../entities/user.entity';
import { Quote } from '../../entities/quote.entity';
import { Gamble } from '../../entities/gamble.entity';
import { BadgesModule } from '../badges/badges.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Quote, Gamble]), BadgesModule, EmailModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
