import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Character } from './character.entity';

@Entity()
export class Faction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Character, character => character.factions)
  @JoinTable()
  characters: Character[];
}
