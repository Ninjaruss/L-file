import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VolumesService } from './volumes.service';
import { Volume } from '../../entities/volume.entity';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('volumes')
@Controller('volumes')
export class VolumesController {
  constructor(private readonly service: VolumesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all volumes',
    description: 'Retrieve a paginated list of volumes with optional filtering by series, number, and title'
  })
  @ApiQuery({ name: 'series', required: false, description: 'Filter by series name' })
  @ApiQuery({ name: 'number', required: false, description: 'Filter by volume number' })
  @ApiQuery({ name: 'title', required: false, description: 'Filter by volume title' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Volumes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              number: { type: 'number', example: 1 },
              title: { type: 'string', example: 'The Beginning' },
              coverUrl: { type: 'string', example: 'https://example.com/covers/volume1.jpg' },
              startChapter: { type: 'number', example: 1 },
              endChapter: { type: 'number', example: 10 },
              description: { type: 'string', example: 'The first volume introducing main characters' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 }
      }
    }
  })
  async findAll(
    @Query('series') series?: string,
    @Query('number') number?: number,
    @Query('title') title?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC'
  ) {
    return this.service.findAll({ series, number, title, page, limit, sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get volume by ID',
    description: 'Retrieve a specific volume by its ID'
  })
  @ApiParam({ name: 'id', description: 'Volume ID' })
  @ApiResponse({
    status: 200,
    description: 'Volume found',
    type: Volume
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found'
  })
  async findOne(@Param('id') id: string) {
    const volume = await this.service.findOne(+id);
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }
    return volume;
  }

  @Get('chapter/:chapterNumber/series/:seriesId')
  @ApiOperation({
    summary: 'Get volume by chapter number',
    description: 'Find which volume contains a specific chapter'
  })
  @ApiParam({ name: 'chapterNumber', description: 'Chapter number' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Volume found',
    type: Volume
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found for this chapter'
  })
  async findByChapter(
    @Param('chapterNumber') chapterNumber: string,
    @Param('seriesId') seriesId: string
  ) {
    const volume = await this.service.findByChapter(+chapterNumber, +seriesId);
    if (!volume) {
      throw new NotFoundException('Volume not found for this chapter');
    }
    return volume;
  }

  @Get(':id/chapters')
  @ApiOperation({
    summary: 'Get chapters in volume',
    description: 'Get the range of chapter numbers included in this volume'
  })
  @ApiParam({ name: 'id', description: 'Volume ID' })
  @ApiResponse({
    status: 200,
    description: 'Chapter range retrieved',
    schema: {
      type: 'object',
      properties: {
        chapters: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
      }
    }
  })
  async getChapters(@Param('id') id: string) {
    const volume = await this.service.findOne(+id);
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }
    return {
      chapters: this.service.getChapterRange(volume)
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UsePipes(new ValidationPipe())
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create volume',
    description: 'Create a new volume (Admin/Moderator only)'
  })
  @ApiBody({ type: CreateVolumeDto })
  @ApiResponse({
    status: 201,
    description: 'Volume created successfully',
    type: Volume
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid volume data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Moderator role required'
  })
  create(@Body() data: CreateVolumeDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update volume',
    description: 'Update an existing volume (Admin/Moderator only)'
  })
  @ApiParam({ name: 'id', description: 'Volume ID' })
  @ApiResponse({
    status: 200,
    description: 'Volume updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Moderator role required'
  })
  async update(@Param('id') id: string, @Body() data: Partial<Volume>) {
    const result = await this.service.update(+id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Volume not found');
    }
    return { message: 'Volume updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete volume',
    description: 'Delete a volume (Admin only)'
  })
  @ApiParam({ name: 'id', description: 'Volume ID' })
  @ApiResponse({
    status: 200,
    description: 'Volume deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required'
  })
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(+id);
    if (result.affected === 0) {
      throw new NotFoundException('Volume not found');
    }
    return { message: 'Volume deleted successfully' };
  }
}
