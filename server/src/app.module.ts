import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from './modules/series/series.module';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { ChapterSpoilersModule } from './modules/chapter_spoilers/chapter_spoilers.module'; // updated
import { FactionsModule } from './modules/factions/factions.module';
import { TagsModule } from './modules/tags/tags.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,   // makes process.env values available everywhere
      envFilePath: '.env', // make sure this path points to your .env
    }),
    
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
    FactionsModule,
    TagsModule, 

    UsersModule, 
    AuthModule,       
  ],
})
export class AppModule {}
