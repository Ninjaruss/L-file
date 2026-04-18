import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
@Index(['number'], { unique: true })
export class Chapter {
  @ApiProperty({ description: 'Unique identifier of the chapter' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description:
      'Chapter number (supports decimals for side stories, e.g. 20.5)',
    example: 1,
  })
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 1,
    transformer: { to: (v) => v, from: (v) => parseFloat(v) },
  })
  number: number;

  @ApiPropertyOptional({
    description: 'Title of the chapter',
    example: 'The Beginning of Fate',
  })
  @Column({ nullable: true, length: 200 })
  title: string;

  @ApiPropertyOptional({
    description: "Brief summary of the chapter's content",
  })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @ApiProperty({
    description: 'Whether this chapter page has been verified by a moderator',
  })
  @Column({ default: false })
  isVerified: boolean;

  @ApiPropertyOptional({
    description: 'ID of the moderator who last verified this page',
  })
  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @ApiPropertyOptional({ description: 'When this page was last verified' })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
}
