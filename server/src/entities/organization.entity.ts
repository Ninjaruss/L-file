import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Character } from './character.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity()
export class Organization {
  @ApiProperty({ description: 'Unique identifier of the organization' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the organization',
    example: 'IDEAL',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the organization',
    example: 'A powerful organization that...',
  })
  @Column({ nullable: true })
  description: string;

  @ApiHideProperty()
  @ManyToMany(() => Character, (character) => character.organizations)
  @JoinTable()
  characters: Character[];
}
