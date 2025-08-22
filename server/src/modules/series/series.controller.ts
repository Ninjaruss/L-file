import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Query, UsePipes, ValidationPipe } from '@nestjs/common';
// ...existing code...
import { SeriesService } from './series.service';
import { Series } from '../../entities/series.entity';

@Controller('series')
export class SeriesController {
  constructor(private readonly service: SeriesService) {}

  /**
   * Pagination and sorting: page (default 1), limit (default 20), sort (id, name, order), order (ASC/DESC)
   */
  @Get()
  async getAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Series[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Series> {
    const series = await this.service.findOne(id);
    if (!series) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return series;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() data: Partial<Series>) {
    return this.service.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: number, @Body() data: Partial<Series>) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Series with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
