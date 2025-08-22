import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Character } from './character.entity';
import { Chapter } from './chapter.entity';

@Entity()
export class GambleTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Gamble, gamble => gamble.teams)
  gamble: Gamble;

  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_team_members' })
  members: Character[];

  @Column({ type: 'text', nullable: true })
  stake?: string;
}

@Entity()
export class GambleRound {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundNumber: number;

  @ManyToOne(() => Gamble, gamble => gamble.rounds)
  gamble: Gamble;

  @ManyToOne(() => GambleTeam, { nullable: true })
  winner?: GambleTeam;

  @Column({ type: 'text' })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  reward?: string;

  @Column({ type: 'text', nullable: true })
  penalty?: string;
}

@Entity()
export class Gamble {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  rules: string;

  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @OneToMany(() => GambleTeam, team => team.gamble, { cascade: true })
  teams: GambleTeam[];

  @OneToMany(() => GambleRound, round => round.gamble, { cascade: true, nullable: true })
  rounds?: GambleRound[];

  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_observers' })
  observers: Character[];

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
