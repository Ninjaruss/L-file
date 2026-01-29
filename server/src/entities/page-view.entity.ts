import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PageType {
  GUIDE = 'guide',
  CHARACTER = 'character',
  EVENT = 'event',
  GAMBLE = 'gamble',
  ARC = 'arc',
  VOLUME = 'volume',
  CHAPTER = 'chapter',
  QUOTE = 'quote',
  ORGANIZATION = 'organization',
}

@Entity()
@Index(['pageType', 'pageId'])
@Index(['pageType', 'createdAt'])
@Index(['createdAt'])
export class PageView {
  @ApiProperty({ description: 'Unique identifier of the page view' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Type of page being viewed',
    enum: PageType,
    example: PageType.GUIDE,
  })
  @Column({
    type: 'enum',
    enum: PageType,
  })
  pageType: PageType;

  @ApiProperty({
    description: 'ID of the specific page/entity being viewed',
    example: 123,
  })
  @Column()
  pageId: number;

  @ApiProperty({
    description: 'IP address of the viewer (optional for privacy)',
    example: '192.168.1.1',
  })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ApiProperty({
    description: 'User agent string (optional)',
    example: 'Mozilla/5.0...',
  })
  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Date and time when the page was viewed' })
  @CreateDateColumn()
  createdAt: Date;
}
