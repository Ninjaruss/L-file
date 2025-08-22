import { Controller, Get, Param, Post, Body, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Tag } from '../../entities/tag.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private service: TagsService) {}

  /**
   * Sorting: sort (id, name), order (ASC/DESC)
   */
  @Get()
  async getAll(
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Tag[]> {
    return this.service.findAll({ sort, order });
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<Tag> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Tag>): Promise<Tag> {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(@Param('id') id: number, @Body() data: Partial<Tag>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
