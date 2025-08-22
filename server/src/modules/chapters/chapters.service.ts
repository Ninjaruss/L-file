import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';

@Injectable()
export class ChaptersService {
  constructor(@InjectRepository(Chapter) private repo: Repository<Chapter>) {}

  findAll(filters: { title?: string; number?: string; arc?: string; series?: string }): Promise<Chapter[]> {
    const query = this.repo.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.arc', 'arc')
      .leftJoinAndSelect('chapter.series', 'series');

    if (filters.title) {
      query.andWhere('LOWER(chapter.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
    }
    if (filters.number) {
      query.andWhere('chapter.number = :number', { number: filters.number });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${filters.arc}%` });
    }
    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }

    return query.getMany();
  }

  findOne(id: number): Promise<Chapter | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'series'] });
  }

  create(data: Partial<Chapter>): Promise<Chapter> {
    const chapter = this.repo.create(data);
    return this.repo.save(chapter);
  }

  update(id: number, data: Partial<Chapter>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
