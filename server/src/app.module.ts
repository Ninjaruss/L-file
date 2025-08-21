import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from './modules/series/series.module';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { ChapterSpoilersModule } from './modules/chapter_spoilers/chapter_spoilers.module'; // updated
import { UsersModule } from './modules/users/users.module';
import { FactionsModule } from './modules/factions/factions.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'ninjaruss',      // your macOS/PostgreSQL user
      password: 'your_password',
      database: 'usogui_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    SeriesModule,
    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    ChapterSpoilersModule,
    UsersModule,
    FactionsModule,
    TagsModule,       // updated
  ],
})
export class AppModule {}
