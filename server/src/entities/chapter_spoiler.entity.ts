import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';
import { Chapter } from './chapter.entity';

@Entity()
export class ChapterSpoiler {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.id)
  event: Event;

  @ManyToOne(() => Chapter, chapter => chapter.id)
  chapter: Chapter;
}
