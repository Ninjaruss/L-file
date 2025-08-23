import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { CreateArcDto } from './dto/create-arc.dto';

@Injectable()
export class ArcsService {
  constructor(
    @InjectRepository(Arc) private repo: Repository<Arc>
  ) {}

  /**
   * Pagination: page (default 1), limit (default 20)
   */
  async findAll(filters: { name?: string; series?: string; description?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' }) {
    const { page = 1, limit = 20, sort, order = 'ASC' } = filters;
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

    // Sorting: only allow certain fields for safety
    const allowedSort = ['id', 'name', 'description', 'order'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`arc.${sort}`, order);
    } else {
      query.orderBy('arc.order', 'ASC'); // Default: canonical order
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

  findOne(id: number) {
    return this.repo.findOne({ 
      where: { id }, 
      relations: ['series', 'characters'] 
    });
  }

  async create(data: CreateArcDto) {
    const arc = this.repo.create({
      name: data.name,
      order: data.order,
      description: data.description,
      series: { id: data.seriesId } as any,
      startChapter: data.startChapter,
      endChapter: data.endChapter
    });
    return this.repo.save(arc);
  }

  update(id: number, data: Partial<Arc>) {
    return this.repo.update(id, data);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
