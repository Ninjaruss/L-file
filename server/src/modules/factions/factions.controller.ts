import { Controller, Get, Param, Post, Body, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { FactionsService } from './factions.service';
import { Faction } from '../../entities/faction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('factions')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() data: Partial<Faction>): Promise<Faction> {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(@Param('id') id: number, @Body() data: Partial<Faction>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
