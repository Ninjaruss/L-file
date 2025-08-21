import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { Series } from './series.entity';
import { Media } from './media.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  startChapter: number;

  @Column({ nullable: true })
  endChapter: number;

  @ManyToOne(() => Arc, arc => arc.id, { nullable: true })
  arc: Arc;

  @ManyToMany(() => Character)
  @JoinTable()
  characters: Character[];

  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @OneToMany(() => Media, media => media.event, {nullable: true, cascade: true })
  media: Media[];

  @ManyToOne(() => User, user => user.submittedEvents, { nullable: true })
  createdBy: User;

  @ManyToMany(() => Tag, tag => tag.events, { nullable: true })
  tags: Tag[];
}
