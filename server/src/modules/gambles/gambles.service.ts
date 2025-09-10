import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { Character } from '../../entities/character.entity';
import { CreateGambleDto } from './dto/create-gamble.dto';
import { UpdateGambleDto } from './dto/update-gamble.dto';

@Injectable()
export class GamblesService {
  constructor(
    @InjectRepository(Gamble)
    private gamblesRepository: Repository<Gamble>,
    @InjectRepository(Character)
    private charactersRepository: Repository<Character>,
  ) {}

  async create(createGambleDto: CreateGambleDto): Promise<Gamble> {
    const gamble = new Gamble();
    gamble.name = createGambleDto.name;
    gamble.rules = createGambleDto.rules;
    gamble.winCondition = createGambleDto.winCondition;
    gamble.chapterId = createGambleDto.chapterId;

    // Handle participants if provided
    if (
      createGambleDto.participantIds &&
      createGambleDto.participantIds.length > 0
    ) {
      const participants = await this.charactersRepository.findByIds(
        createGambleDto.participantIds,
      );
      gamble.participants = participants;
    }

    return await this.gamblesRepository.save(gamble);
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options || {};
    const [data, total] = await this.gamblesRepository.findAndCount({
      relations: ['participants'],
      order: {
        chapterId: 'ASC',
        id: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllGambles(): Promise<Gamble[]> {
    return await this.gamblesRepository.find({
      relations: ['participants'],
      order: {
        chapterId: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Gamble> {
    const gamble = await this.gamblesRepository.findOne({
      where: { id },
      relations: ['participants'],
    });

    if (!gamble) {
      throw new NotFoundException(`Gamble with ID ${id} not found`);
    }

    return gamble;
  }

  async findByChapter(chapterId: number): Promise<Gamble[]> {
    return await this.gamblesRepository.find({
      where: { chapterId },
      relations: ['participants'],
      order: { id: 'ASC' },
    });
  }

  async update(id: number, updateGambleDto: UpdateGambleDto): Promise<Gamble> {
    const gamble = await this.findOne(id); // Validates existence and loads relations

    // Update basic fields
    gamble.name = updateGambleDto.name ?? gamble.name;
    gamble.rules = updateGambleDto.rules ?? gamble.rules;
    gamble.winCondition = updateGambleDto.winCondition ?? gamble.winCondition;
    gamble.chapterId = updateGambleDto.chapterId ?? gamble.chapterId;

    // Handle participants if provided
    if (updateGambleDto.participantIds !== undefined) {
      if (updateGambleDto.participantIds.length > 0) {
        const participants = await this.charactersRepository.findByIds(
          updateGambleDto.participantIds,
        );
        gamble.participants = participants;
      } else {
        gamble.participants = [];
      }
    }

    return await this.gamblesRepository.save(gamble);
  }

  async remove(id: number): Promise<DeleteResult> {
    await this.findOne(id); // Validates existence
    return await this.gamblesRepository.delete(id);
  }

  async findGamblesByName(name: string): Promise<Gamble[]> {
    return await this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .where('LOWER(gamble.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .orderBy('gamble.chapterId', 'ASC')
      .addOrderBy('gamble.id', 'ASC')
      .getMany();
  }

  async search(filters: {
    gambleName?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
    page?: number;
  }): Promise<{
    data: Gamble[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = filters;
    const query = this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants');

    if (filters.gambleName) {
      query.andWhere('LOWER(gamble.name) LIKE LOWER(:gambleName)', {
        gambleName: `%${filters.gambleName}%`,
      });
    }

    if (filters.chapterId) {
      query.andWhere('gamble.chapterId = :chapterId', {
        chapterId: filters.chapterId,
      });
    }

    if (filters.characterId) {
      query.andWhere('participants.id = :characterId', {
        characterId: filters.characterId,
      });
    }

    if (filters.participantName) {
      query.andWhere('LOWER(participants.name) LIKE LOWER(:participantName)', {
        participantName: `%${filters.participantName}%`,
      });
    }

    query.orderBy('gamble.chapterId', 'ASC').addOrderBy('gamble.id', 'ASC');

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCharacter(characterId: number): Promise<Gamble[]> {
    return await this.gamblesRepository
      .createQueryBuilder('gamble')
      .leftJoinAndSelect('gamble.participants', 'participants')
      .where('participants.id = :characterId', { characterId })
      .orderBy('gamble.chapterId', 'ASC')
      .addOrderBy('gamble.id', 'ASC')
      .getMany();
  }

  async findByTeam(teamName: string): Promise<Gamble[]> {
    // Note: This method needs to be implemented based on team-gamble relationships
    // For now, returning empty array to fix TypeScript errors
    // TODO: Implement proper team-gamble relationship logic
    return [];
  }

  async getTeamsForGamble(id: number): Promise<string[]> {
    // Note: This method needs to be implemented based on gamble-team relationships
    // For now, returning empty array to fix TypeScript errors
    // TODO: Implement proper gamble-team relationship logic
    await this.findOne(id); // Validate gamble exists
    return [];
  }
}
