import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';

@Injectable()
export class CharactersService {
  constructor(@InjectRepository(Character) private repo: Repository<Character>) {}

  findAll(filters: { name?: string; arc?: string; series?: string; description?: string }): Promise<Character[]> {
    const query = this.repo.createQueryBuilder('character')
      .leftJoinAndSelect('character.arc', 'arc')
      .leftJoinAndSelect('character.series', 'series');

    if (filters.name) {
      query.andWhere('LOWER(character.name) LIKE LOWER(:name)', { name: `%${filters.name}%` });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${filters.arc}%` });
    }
    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }
    if (filters.description) {
      query.andWhere('LOWER(character.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }

    return query.getMany();
  }

  findOne(id: number): Promise<Character | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'series'] });
  }

  create(data: Partial<Character>): Promise<Character> {
    const character = this.repo.create(data);
    return this.repo.save(character);
  }

  update(id: number, data: Partial<Character>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
