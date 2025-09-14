import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Character } from './character.entity';
import { Media } from './media.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Gamble {
  @ApiProperty({ description: 'Unique identifier of the gamble' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the gamble',
    example: 'Protoporos',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description: 'Brief description of the gamble',
    example: 'A strategic gambling game played with stones',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Rules of the gamble',
    example: 'Two players take turns removing stones from a pile...',
  })
  @Column({ type: 'text' })
  rules: string;

  @ApiPropertyOptional({
    description: 'Condition for winning the gamble',
    example: 'The player who removes the last stone loses',
  })
  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @ApiProperty({
    description: 'Chapter number where this gamble takes place',
    example: 45,
  })
  @Column()
  chapterId: number;

  @ManyToMany(() => Character)
  @JoinTable({
    name: 'gamble_participants',
    joinColumn: { name: 'gambleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'characterId', referencedColumnName: 'id' },
  })
  participants?: Character[];

  // Media relationships are now handled polymorphically through ownerType/ownerId

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
