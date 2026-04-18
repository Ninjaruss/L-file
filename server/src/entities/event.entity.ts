import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Gamble } from './gamble.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EventType {
  GAMBLE = 'gamble',
  DECISION = 'decision',
  REVEAL = 'reveal',
  SHIFT = 'shift',
  RESOLUTION = 'resolution',
}

@Entity()
@Index(['arc'])
@Index(['chapterNumber'])
@Index(['title'])
@Index(['type'])
@Index(['spoilerChapter'])
@Index(['createdBy'])
export class Event {
  @ApiProperty({ description: 'Unique identifier of the event' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Title of the event',
    example: 'The 17 Steps Tournament',
  })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: 'Detailed description of the event' })
  @Column({ type: 'text', nullable: false })
  description: string;

  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    default: EventType.DECISION,
  })
  @Column({ type: 'enum', enum: EventType, default: EventType.DECISION })
  type: EventType;

  @ApiProperty({
    description: 'Chapter number where this event occurs',
    example: 45,
  })
  @Column({ type: 'int' })
  chapterNumber: number;

  @ApiPropertyOptional({
    description: 'Page number within the chapter for sub-chapter ordering',
    example: 14,
  })
  @Column({ type: 'int', nullable: true })
  pageNumber: number | null;

  @ApiPropertyOptional({
    description:
      'Chapter number required before showing this event (spoiler protection)',
    example: 44,
  })
  @Column({ type: 'int', nullable: true })
  spoilerChapter: number | null;

  @ApiPropertyOptional({
    description: 'Story arc this event belongs to',
    type: () => Arc,
  })
  @ManyToOne(() => Arc, { nullable: true })
  @JoinColumn({ name: 'arcId' })
  arc: Arc;

  @ApiPropertyOptional({
    description: 'ID of the arc this event belongs to',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  arcId: number;

  @ApiPropertyOptional({
    description: 'Gamble associated with this event',
    type: () => Gamble,
  })
  @ManyToOne(() => Gamble, { nullable: true })
  @JoinColumn({ name: 'gambleId' })
  gamble: Gamble;

  @ApiPropertyOptional({
    description: 'ID of the gamble associated with this event',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  gambleId: number;

  @ManyToMany(() => Character)
  @JoinTable()
  characters: Character[];

  @ManyToOne(() => User, (user) => user.submittedEvents, { nullable: true })
  createdBy: User;

  @ManyToMany(() => Tag, (tag) => tag.events)
  tags: Tag[];

  @ApiProperty({ description: 'When this event was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When this event was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
