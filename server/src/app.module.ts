import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TagsModule } from './modules/tags/tags.module';
import { VolumesModule } from './modules/volumes/volumes.module';
import { SearchModule } from './modules/search/search.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { GamblesModule } from './modules/gambles/gambles.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { MediaModule } from './modules/media/media.module';
import { GuidesModule } from './modules/guides/guides.module';
import { PageViewsModule } from './modules/page-views/page-views.module';
import { BadgesModule } from './modules/badges/badges.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CharacterRelationshipsModule } from './modules/character-relationships/character-relationships.module';
import { CharacterOrganizationsModule } from './modules/character-organizations/character-organizations.module';
import { AnnotationsModule } from './modules/annotations/annotations.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { EditLogModule } from './modules/edit-log/edit-log.module';
import { FluxerChatModule } from './modules/fluxer-chat/fluxer-chat.module';
import { AppController } from './app.controller';
import { Guide } from './entities/guide.entity';
import { Character } from './entities/character.entity';
import { Event } from './entities/event.entity';
import { Gamble } from './entities/gamble.entity';
import { Arc } from './entities/arc.entity';
import { Media } from './entities/media.entity';
import { User } from './entities/user.entity';
import { Annotation } from './entities/annotation.entity';
import { EditLog } from './entities/edit-log.entity';
import { UserFavoriteCharacter } from './entities/user-favorite-character.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = getDatabaseConfig(configService);

        // Block schema sync in production — it can destroy data
        if (
          configService.get('NODE_ENV') === 'production' &&
          configService.get('ENABLE_SCHEMA_SYNC') === 'true'
        ) {
          throw new Error(
            'FATAL: ENABLE_SCHEMA_SYNC=true is not allowed in production. Disable it and use migrations instead.',
          );
        }

        return dbConfig;
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([
      Guide,
      Character,
      Event,
      Gamble,
      Arc,
      Media,
      User,
      Annotation,
      EditLog,
      UserFavoriteCharacter,
    ]),

    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    OrganizationsModule,
    TagsModule,
    VolumesModule,
    SearchModule,

    UsersModule,
    AuthModule,
    TranslationsModule,
    GamblesModule,
    QuotesModule,
    MediaModule,
    GuidesModule,
    PageViewsModule,
    BadgesModule,
    TasksModule,
    CharacterRelationshipsModule,
    CharacterOrganizationsModule,
    AnnotationsModule,
    ContributionsModule,
    EditLogModule,
    FluxerChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
