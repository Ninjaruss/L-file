import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FluxerChatController } from './fluxer-chat.controller';
import { FluxerChatService } from './fluxer-chat.service';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FluxerAnnouncement, User])],
  controllers: [FluxerChatController],
  providers: [FluxerChatService],
})
export class FluxerChatModule {}
