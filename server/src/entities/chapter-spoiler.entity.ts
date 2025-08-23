import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Event } from './event.entity';
import { Character } from './character.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SpoilerLevel {
  REVEAL = 'reveal',      // Story revelations about past events or character backgrounds
                         // Example: "Character X's true identity is revealed"
  
  OUTCOME = 'outcome',    // Important outcomes that affect the story
                         // Example: "Character loses everything in the game"
  
  TWIST = 'twist',       // Unexpected developments or betrayals
                         // Example: "The game was a setup from the beginning"
  
  FATE = 'fate'         // Major character deaths or life-changing events
                       // Example: "Character dies during the game"
}

export enum SpoilerCategory {
  PLOT = 'plot',           // Story revelations and developments
                          // Example: "The true purpose of the tournament is revealed"
  
  CHARACTER = 'character', // Character motivations, betrayals, relationships
                          // Example: "Character X was working with Character Y all along"
  
  PLOT_TWIST = 'plot_twist' // Major story twists that change everything
                           // Example: "The entire arc was orchestrated by..."
}

// Interface for chapter references with context
export interface ChapterReference {
  chapterNumber: number;
  context: string;  // e.g., "Page 15 - Character introduction" or "Final scene - Important dialogue"
}

@Entity()
export class ChapterSpoiler {
  @ApiProperty({ description: 'Unique identifier for the spoiler' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ description: 'Associated event', type: () => Event })
  @ManyToOne(() => Event, event => event.id, { nullable: true })
  event: Event;

  @ApiProperty({ description: 'Chapter number where this spoiler occurs', example: 15 })
  @Column()
  chapterNumber: number;

  @ApiProperty({ 
    description: 'Severity level of the spoiler',
    enum: SpoilerLevel,
    default: SpoilerLevel.REVEAL,
    example: SpoilerLevel.REVEAL
  })
  @Column({
    type: 'enum',
    enum: SpoilerLevel,
    default: SpoilerLevel.REVEAL
  })
  level: SpoilerLevel;

  @ApiProperty({
    description: 'Category of the spoiler',
    enum: SpoilerCategory,
    default: SpoilerCategory.PLOT,
    example: SpoilerCategory.PLOT
  })
  @Column({
    type: 'enum',
    enum: SpoilerCategory,
    default: SpoilerCategory.PLOT
  })
  category: SpoilerCategory;

  @ApiProperty({ 
    description: 'Spoiler content description',
    example: 'A major character revelation occurs during the final gamble'
  })
  @Column('text')
  content: string;

  @ApiProperty({ 
    description: 'Whether this spoiler has been verified by moderators',
    example: true
  })
  @Column({ default: false })
  isVerified: boolean;

  // Characters affected by this spoiler
  @ApiPropertyOptional({ description: 'Characters affected by this spoiler', type: () => [Character] })
  @ManyToMany(() => Character)
  @JoinTable({ name: 'chapter_spoiler_characters' })
  affectedCharacters: Character[];

  // List of chapter references with context for additional reading
  @ApiPropertyOptional({ 
    description: 'List of chapter references with context for additional reading',
    example: [
      { chapterNumber: 10, context: "Page 8 - Character background revealed" },
      { chapterNumber: 12, context: "Final scene - Important foreshadowing" }
    ]
  })
  @Column('json', { nullable: true })
  chapterReferences: ChapterReference[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
