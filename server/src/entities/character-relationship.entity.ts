import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { Character } from './character.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RelationshipType {
  ALLY = 'ally',
  RIVAL = 'rival',
  MENTOR = 'mentor',
  SUBORDINATE = 'subordinate',
  FAMILY = 'family',
  PARTNER = 'partner',
  ENEMY = 'enemy',
  ACQUAINTANCE = 'acquaintance',
}

@Entity()
@Index(['sourceCharacterId'])
@Index(['targetCharacterId'])
@Index(['relationshipType'])
@Index(['spoilerChapter'])
@Check('"sourceCharacterId" != "targetCharacterId"')
@Check('"endChapter" IS NULL OR "endChapter" >= "startChapter"')
export class CharacterRelationship {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The character who has this relationship',
    type: () => Character,
  })
  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceCharacterId' })
  sourceCharacter: Character;

  @ApiProperty({ description: 'ID of the source character' })
  @Column()
  sourceCharacterId: number;

  @ApiProperty({
    description: 'The character toward whom the relationship is directed',
    type: () => Character,
  })
  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetCharacterId' })
  targetCharacter: Character;

  @ApiProperty({ description: 'ID of the target character' })
  @Column()
  targetCharacterId: number;

  @ApiProperty({
    description: 'Type of relationship',
    enum: RelationshipType,
    example: RelationshipType.RIVAL,
  })
  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relationshipType: RelationshipType;

  @ApiPropertyOptional({
    description: 'Short description of the relationship context',
    example: 'Met during the Labyrinth game and became allies',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Chapter number where this relationship begins or is revealed',
    example: 15,
  })
  @Column()
  startChapter: number;

  @ApiPropertyOptional({
    description:
      'Chapter number where this relationship ends (null if ongoing)',
    example: 100,
  })
  @Column({ type: 'int', nullable: true })
  endChapter: number | null;

  @ApiProperty({
    description:
      'Chapter the user should have read before seeing this relationship (spoiler protection)',
    example: 14,
  })
  @Column()
  spoilerChapter: number;

  @ApiProperty({ description: 'When this relationship was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When this relationship was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
