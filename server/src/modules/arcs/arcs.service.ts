import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arc } from '../../entities/arc.entity';

@Injectable()
export class ArcsService {
  constructor(@InjectRepository(Arc) private repo: Repository<Arc>) {}

  findAll(filters: { name?: string; series?: string; description?: string }) {
    const query = this.repo.createQueryBuilder('arc')
      .leftJoinAndSelect('arc.series', 'series')
      .leftJoinAndSelect('arc.characters', 'characters');

    if (filters.name) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:name)', { name: `%${filters.name}%` });
    }
    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }
    if (filters.description) {
      query.andWhere('LOWER(arc.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }

    return query.getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['series', 'characters'] });
  }

  create(data: Partial<Arc>) {
    const arc = this.repo.create(data);
    return this.repo.save(arc);
  }

  update(id: number, data: Partial<Arc>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
