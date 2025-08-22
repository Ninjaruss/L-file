import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  findAll(filters: { title?: string; arc?: string; series?: string; description?: string }): Promise<Event[]> {
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

    return query.getMany();
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
