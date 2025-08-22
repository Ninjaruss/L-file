import { Controller, Get, Param, Post, Body, Put, Delete, Query } from '@nestjs/common';
// ...existing code...
import { FactionsService } from './factions.service';
import { Faction } from '../../entities/faction.entity';

@Controller('factions')
export class FactionsController {
  constructor(private service: FactionsService) {}

  /**
   * Sorting: sort (id, name), order (ASC/DESC)
   */
  @Get()
  async getAll(
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Faction[]> {
    return this.service.findAll({ sort, order });
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<Faction> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Faction>): Promise<Faction> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Faction>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
