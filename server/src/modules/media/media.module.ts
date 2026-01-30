// media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Media } from '../../entities/media.entity';
import { Character } from '../../entities/character.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { EmailModule } from '../email/email.module';
import { UrlNormalizerService } from './services/url-normalizer.service';
import { MediaUrlResolverService } from './services/media-url-resolver.service';
import { FileValidationService } from './validators/file-validation.service';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, Character]),
    HttpModule,
    EmailModule,
    ServicesModule,
  ],
  providers: [
    MediaService,
    UrlNormalizerService,
    MediaUrlResolverService,
    FileValidationService,
  ],
  controllers: [MediaController],
  exports: [MediaService, MediaUrlResolverService],
})
export class MediaModule {}
