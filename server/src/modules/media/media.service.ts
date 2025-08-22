// media.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../entities/media.entity';
import { CreateMediaDto } from './dtos/create-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  async create(data: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepo.create({
        url: data.url,
        type: data.type,
        description: data.description,
        arc: data.arcId ? { id: data.arcId } as any : null,
        character: data.characterId ? { id: data.characterId } as any : null,
        event: data.eventId ? { id: data.eventId } as any : null,
    });
    return this.mediaRepo.save(media);
    }


  async findAll(): Promise<Media[]> {
    return this.mediaRepo.find({ relations: ['arc', 'character', 'event'] });
  }

  async findOne(id: number): Promise<Media | null> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
    throw new NotFoundException(`Media with id ${id} not found`);
    }
    return media;
    }

  async remove(id: number): Promise<void> {
    await this.mediaRepo.delete(id);
  }
}
