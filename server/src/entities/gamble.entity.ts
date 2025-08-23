import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Character } from './character.entity';
import { GambleTeam } from './gamble-team.entity';
import { GambleRound } from './gamble-round.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Gamble {
  @ApiProperty({ description: 'Unique identifier of the gamble' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Name of the gamble',
    example: 'Protoporos'
  })
  @Column()
  name: string;

  @ApiProperty({ 
    description: 'Rules of the gamble',
    example: 'Two players take turns removing stones from a pile...'
  })
  @Column({ type: 'text' })
  rules: string;

  @ApiPropertyOptional({ 
    description: 'Condition for winning the gamble',
    example: 'The player who removes the last stone loses'
  })
  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @ApiPropertyOptional({ 
    description: 'Teams participating in this gamble',
    type: () => [GambleTeam]
  })
  @OneToMany(() => GambleTeam, team => team.gamble, { cascade: true })
  teams: GambleTeam[];

  @ApiPropertyOptional({ 
    description: 'Rounds of this gamble',
    type: () => [GambleRound]
  })
  @OneToMany(() => GambleRound, round => round.gamble, { cascade: true, nullable: true })
  rounds?: GambleRound[];

  @ApiPropertyOptional({ 
    description: 'Characters observing this gamble',
    type: () => [Character]
  })
  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_observers' })
  observers: Character[];

  @ApiProperty({ 
    description: 'Chapter number where this gamble takes place',
    example: 45
  })
  @Column()
  chapterId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
