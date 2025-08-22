import { Controller, Get, Param, Post, Body, Put, Delete, Query, UsePipes, ValidationPipe } from '@nestjs/common';
// ...existing code...
import { TagsService } from './tags.service';
import { Tag } from '../../entities/tag.entity';

@Controller('tags')
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() data: Partial<Tag>): Promise<Tag> {
    return this.service.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(@Param('id') id: number, @Body() data: Partial<Tag>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
