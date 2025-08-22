import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
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
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production',
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
