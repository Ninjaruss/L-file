import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: { title?: string; arc?: string; series?: string; description?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
    const query = this.repo.createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.series', 'series')
      .leftJoinAndSelect('event.characters', 'characters');

    if (filters.title) {
      query.andWhere('LOWER(event.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
    }
    if (filters.arc) {
      query.andWhere('LOWER(arc.name) LIKE LOWER(:arc)', { arc: `%${filters.arc}%` });
    }
    if (filters.series) {
      query.andWhere('LOWER(series.name) LIKE LOWER(:series)', { series: `%${filters.series}%` });
    }
    if (filters.description) {
      query.andWhere('LOWER(event.description) LIKE LOWER(:description)', { description: `%${filters.description}%` });
    }

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'title', 'description'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`event.${sort}`, order);
    } else {
      query.orderBy('event.id', 'ASC');
    }

    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: number): Promise<Event | null> {
    return this.repo.findOne({ where: { id }, relations: ['arc', 'characters', 'series'] });
  }

  create(data: Partial<Event>): Promise<Event> {
    const event = this.repo.create(data);
    return this.repo.save(event);
  }

  update(id: number, data: Partial<Event>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
