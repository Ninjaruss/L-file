import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { ChapterSpoilersService } from './chapter_spoilers.service';
import { ChapterSpoiler } from '../../entities/chapter_spoiler.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('chapter-spoilers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChapterSpoilersController {
  constructor(private readonly service: ChapterSpoilersService) {}

  @Get()
  getAll(): Promise<ChapterSpoiler[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<ChapterSpoiler> {
    const cs = await this.service.findOne(id);
    if (!cs) {
      throw new NotFoundException(`ChapterSpoiler with id ${id} not found`);
    }
    return cs;
  }

    @Post()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<ChapterSpoiler>): Promise<ChapterSpoiler> {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<ChapterSpoiler>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter spoiler with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Chapter spoiler with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
