import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event, EventType } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all events',
    description: 'Paginated, filterable list of events',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events with pagination metadata',
  })
  async getAll(
    @Query(new ValidationPipe({ transform: true })) filters: FilterEventsDto,
  ) {
    return this.service.findAll(filters);
  }

  @Get('grouped/by-arc')
  @ApiOperation({
    summary: 'Get events grouped by arc',
    description:
      'All events grouped by story arc, ordered by chapter then page',
  })
  async getGroupedByArc(
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('type') type?: EventType,
  ) {
    return this.service.findGroupedByArc({ userProgress, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
    const event = await this.service.findOne(id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event (editor/moderator/admin)' })
  @ApiBody({ type: CreateEventDto })
  async create(
    @Body(ValidationPipe) createEventDto: CreateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.service.create(createEventDto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event (editor/moderator/admin)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateEventDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, updateEventDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event (admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.remove(id, user.id);
  }
}
