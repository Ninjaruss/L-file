import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
import { diffFields } from '../../common/utils/diff-fields';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private repo: Repository<Event>,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    private readonly editLogService: EditLogService,
  ) {}

  async findAll(filters: FilterEventsDto) {
    const { page = 1, limit = 20, sort = 'chapterNumber', order = 'ASC' } = filters;

    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .leftJoinAndSelect('event.gamble', 'gamble');

    if (filters.search) {
      query.andWhere(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.arcId) {
      query.andWhere('event.arcId = :arcId', { arcId: filters.arcId });
    }
    if (filters.gambleId) {
      query.andWhere('event.gambleId = :gambleId', { gambleId: filters.gambleId });
    }
    if (filters.chapterNumber) {
      query.andWhere('event.chapterNumber = :chapterNumber', { chapterNumber: filters.chapterNumber });
    }
    if (filters.characterId) {
      query.andWhere('characters.id = :characterId', { characterId: filters.characterId });
    }
    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }
    if (filters.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress },
      );
    }

    const allowedSort = ['chapterNumber', 'createdAt'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`event.${sort}`, order);
      if (sort === 'chapterNumber') {
        query.addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');
      }
    } else {
      query
        .orderBy('event.chapterNumber', 'ASC')
        .addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');
    }

    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: number): Promise<Event | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['arc', 'characters', 'tags', 'gamble'],
    });
  }

  async create(data: CreateEventDto, userId?: number): Promise<Event> {
    const { characterIds, ...eventData } = data;

    const cleanedData = {
      ...eventData,
      type: data.type || EventType.DECISION,
      chapterNumber: Number(eventData.chapterNumber) || 1,
      pageNumber:
        eventData.pageNumber && !isNaN(Number(eventData.pageNumber))
          ? Number(eventData.pageNumber)
          : undefined,
      spoilerChapter:
        eventData.spoilerChapter && !isNaN(Number(eventData.spoilerChapter))
          ? Number(eventData.spoilerChapter)
          : undefined,
      arcId:
        eventData.arcId && !isNaN(Number(eventData.arcId))
          ? Number(eventData.arcId)
          : undefined,
    };

    const event = this.repo.create(cleanedData);

    if (characterIds && characterIds.length > 0) {
      const validIds = characterIds.filter((id) => !isNaN(Number(id)));
      if (validIds.length > 0) {
        event.characters = await this.characterRepo.findByIds(
          validIds.map((id) => Number(id)),
        );
      }
    }

    const saved = await this.repo.save(event);

    if (userId) {
      await this.editLogService.logCreate(EditLogEntityType.EVENT, saved.id, userId);
    }

    return saved;
  }

  async update(id: number, data: UpdateEventDto, userId?: number): Promise<Event> {
    const { characterIds, ...updateData } = data;

    const cleanedUpdateData = { ...updateData };
    if (cleanedUpdateData.chapterNumber !== undefined) {
      cleanedUpdateData.chapterNumber = Number(cleanedUpdateData.chapterNumber) || 1;
    }
    if (cleanedUpdateData.pageNumber !== undefined) {
      cleanedUpdateData.pageNumber =
        cleanedUpdateData.pageNumber && !isNaN(Number(cleanedUpdateData.pageNumber))
          ? Number(cleanedUpdateData.pageNumber)
          : undefined;
    }
    if (cleanedUpdateData.spoilerChapter !== undefined) {
      cleanedUpdateData.spoilerChapter =
        cleanedUpdateData.spoilerChapter && !isNaN(Number(cleanedUpdateData.spoilerChapter))
          ? Number(cleanedUpdateData.spoilerChapter)
          : undefined;
    }
    if (cleanedUpdateData.arcId !== undefined) {
      cleanedUpdateData.arcId =
        cleanedUpdateData.arcId && !isNaN(Number(cleanedUpdateData.arcId))
          ? Number(cleanedUpdateData.arcId)
          : undefined;
    }

    const event = await this.repo.findOne({ where: { id }, relations: ['characters'] });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    const changedFields = diffFields(event, cleanedUpdateData);
    if (characterIds !== undefined) changedFields.push('characters');

    if (Object.keys(cleanedUpdateData).length > 0) {
      await this.repo.update(id, cleanedUpdateData);
    }

    if (characterIds !== undefined) {
      const validIds = characterIds.filter((cid) => !isNaN(Number(cid)));
      event.characters =
        validIds.length > 0
          ? await this.characterRepo.findByIds(validIds.map((cid) => Number(cid)))
          : [];
      await this.repo.save(event);
    }

    const result = await this.findOne(id);
    if (!result) throw new NotFoundException(`Event with ID ${id} not found after update`);

    if (userId !== undefined) {
      await this.editLogService.logUpdate(EditLogEntityType.EVENT, id, userId, changedFields);
    }

    return result;
  }

  remove(id: number, userId?: number) {
    if (userId !== undefined) {
      this.editLogService
        .logDelete(EditLogEntityType.EVENT, id, userId)
        .catch(() => {});
    }
    return this.repo.delete(id);
  }

  async findGroupedByArc(filters?: { userProgress?: number; type?: EventType }) {
    const query = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.arc', 'arc')
      .leftJoinAndSelect('event.characters', 'characters')
      .leftJoinAndSelect('event.gamble', 'gamble');

    if (filters?.userProgress !== undefined) {
      query.andWhere(
        '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
        { userProgress: filters.userProgress },
      );
    }
    if (filters?.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }

    query
      .orderBy('event.chapterNumber', 'ASC')
      .addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');

    const events = await query.getMany();

    const arcGroups: Record<number, Event[]> = {};
    const noArcEvents: Event[] = [];

    events.forEach((event) => {
      if (event.arc) {
        if (!arcGroups[event.arc.id]) arcGroups[event.arc.id] = [];
        arcGroups[event.arc.id].push(event);
      } else {
        noArcEvents.push(event);
      }
    });

    const arcs = Object.values(arcGroups).map((arcEvents) => ({
      arc: arcEvents[0].arc,
      events: arcEvents,
    }));
    arcs.sort((a, b) => (a.arc.order || 0) - (b.arc.order || 0));

    return { arcs, noArc: noArcEvents };
  }
}
