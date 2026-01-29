import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

export enum AnnotationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AnnotationOwnerType {
  CHARACTER = 'character',
  GAMBLE = 'gamble',
  ARC = 'arc',
}

@Entity()
@Index(['status'])
@Index(['ownerType', 'ownerId'])
@Index(['authorId'])
@Index(['createdAt'])
export class Annotation {
  @ApiProperty({ description: 'Unique identifier of the annotation' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Type of content this annotation belongs to',
    enum: AnnotationOwnerType,
    example: AnnotationOwnerType.CHARACTER,
  })
  @Column({ type: 'enum', enum: AnnotationOwnerType })
  ownerType: AnnotationOwnerType;

  @ApiProperty({
    description: 'ID of the character, gamble, or arc',
    example: 1,
  })
  @Column({ type: 'int' })
  ownerId: number;

  @ApiProperty({
    description: 'Title or summary of the annotation',
    example: 'Cultural reference to traditional gambling',
  })
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({
    description: 'Main content of the annotation in markdown format',
    example: 'This scene references the traditional Japanese...',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiPropertyOptional({
    description: 'Optional source URL for citations or references',
    example: 'https://en.wikipedia.org/wiki/Example',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceUrl: string | null;

  @ApiPropertyOptional({
    description: 'Optional chapter number for additional context',
    example: 42,
  })
  @Column({ type: 'int', nullable: true })
  chapterReference: number | null;

  @ApiProperty({
    description: 'Whether this annotation contains spoilers',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isSpoiler: boolean;

  @ApiPropertyOptional({
    description:
      'Chapter number after which the spoiler is revealed (only relevant if isSpoiler is true)',
    example: 150,
  })
  @Column({ type: 'int', nullable: true })
  spoilerChapter: number | null;

  @ApiProperty({
    description: 'Current approval status of the annotation',
    enum: AnnotationStatus,
    example: AnnotationStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: AnnotationStatus,
    default: AnnotationStatus.PENDING,
  })
  status: AnnotationStatus;

  @ApiPropertyOptional({
    description: 'Reason for rejection if the annotation was rejected',
    example: 'Content is inaccurate or misleading',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  rejectionReason: string | null;

  @ApiProperty({ description: 'ID of the user who authored this annotation' })
  @Column()
  authorId: number;

  @ApiProperty({
    type: () => User,
    description: 'User who authored this annotation',
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ApiProperty({ description: 'Date and time when the annotation was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time when the annotation was last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
