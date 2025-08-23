import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterSpoiler, SpoilerLevel, SpoilerCategory } from '../../entities/chapter-spoiler.entity';
import { CreateChapterSpoilerDto } from './dto/create-chapter-spoiler.dto';

@Injectable()
export class ChapterSpoilersService {
  constructor(
    @InjectRepository(ChapterSpoiler) 
    private repo: Repository<ChapterSpoiler>
  ) {}

  /**
   * Find all spoilers with optional filtering
   * @param userChapterNumber - The highest chapter number the user has read (for validation)
   */
  async findAll(filters: { 
    level?: SpoilerLevel; 
    category?: SpoilerCategory; 
    chapterNumber?: number; 
    isVerified?: boolean;
    userChapterNumber?: number; // For validation
  }) {
    const query = this.repo.createQueryBuilder('spoiler');

    if (filters.level) {
      query.andWhere('spoiler.level = :level', { level: filters.level });
    }
    if (filters.category) {
      query.andWhere('spoiler.category = :category', { category: filters.category });
    }
    if (filters.chapterNumber) {
      query.andWhere('spoiler.chapterNumber = :chapterNumber', { chapterNumber: filters.chapterNumber });
    }
    if (filters.isVerified !== undefined) {
      query.andWhere('spoiler.isVerified = :isVerified', { isVerified: filters.isVerified });
    }

    // Filter out spoilers the user shouldn't see yet
    if (filters.userChapterNumber !== undefined) {
      query.andWhere('spoiler.chapterNumber <= :userChapterNumber', { 
        userChapterNumber: filters.userChapterNumber 
      });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<ChapterSpoiler> {
    const spoiler = await this.repo.findOne({ where: { id } });
    if (!spoiler) {
      throw new NotFoundException(`Spoiler with ID ${id} not found`);
    }
    return spoiler;
  }

  /**
   * Check if user can view a specific spoiler based on their reading progress
   */
  async canViewSpoiler(spoilerId: number, userChapterNumber: number): Promise<boolean> {
    const spoiler = await this.findOne(spoilerId);
    return userChapterNumber >= spoiler.chapterNumber;
  }

  /**
   * Get spoilers the user can safely view (up to their reading progress)
   */
  async findViewableSpoilers(userChapterNumber: number, filters?: {
    level?: SpoilerLevel;
    category?: SpoilerCategory;
    isVerified?: boolean;
  }): Promise<ChapterSpoiler[]> {
    return this.findAll({
      ...filters,
      userChapterNumber
    });
  }

  async create(data: CreateChapterSpoilerDto): Promise<ChapterSpoiler> {
    const spoiler = this.repo.create(data);
    return this.repo.save(spoiler);
  }

  async update(id: number, data: Partial<CreateChapterSpoilerDto>): Promise<ChapterSpoiler> {
    const spoiler = await this.findOne(id);
    Object.assign(spoiler, data);
    return this.repo.save(spoiler);
  }

  async remove(id: number): Promise<void> {
    const spoiler = await this.findOne(id);
    await this.repo.remove(spoiler);
  }
}
