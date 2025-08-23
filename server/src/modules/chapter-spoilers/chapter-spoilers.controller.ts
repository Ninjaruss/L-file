import { Controller, Get, Post, Put, Delete, Param, Query, ParseIntPipe, UseGuards, Body, NotFoundException } from '@nestjs/common';
import { ChapterSpoilersService } from './chapter-spoilers.service';
import { ChapterSpoiler, SpoilerLevel, SpoilerCategory } from '../../entities/chapter-spoiler.entity';
import { CreateChapterSpoilerDto } from './dto/create-chapter-spoiler.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Chapter Spoilers')
@Controller('chapter-spoilers')
export class ChapterSpoilersController {
  constructor(private readonly service: ChapterSpoilersService) {}

  @ApiOperation({
    summary: 'Get all chapter spoilers with filtering and user validation',
    description: 'Retrieves chapter spoilers with optional filtering by spoiler level, category, chapter, and verification status. Use userChapterNumber to only show spoilers the user should see based on their reading progress.'
  })
  @ApiQuery({ name: 'level', required: false, enum: SpoilerLevel, description: 'Filter by spoiler level', example: 'REVEAL' })
  @ApiQuery({ name: 'category', required: false, enum: SpoilerCategory, description: 'Filter by spoiler category', example: 'CHARACTER' })
  @ApiQuery({ name: 'chapterNumber', required: false, description: 'Filter by chapter number', example: 15 })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status', example: true })
  @ApiQuery({ name: 'userChapterNumber', required: false, description: 'User\'s reading progress - only shows spoilers up to this chapter', example: 20 })
  @ApiOkResponse({
    description: 'Spoilers retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          content: 'A major character revelation occurs during the final gamble',
          level: 'REVEAL',
          category: 'CHARACTER',
          chapterNumber: 15,
          isVerified: true,
          chapterReferences: [
            { chapterNumber: 10, context: "Page 8 - Character background revealed" },
            { chapterNumber: 12, context: "Final scene - Important foreshadowing" }
          ],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      ]
    }
  })
  @Get()
  getAll(
    @Query('level') level?: SpoilerLevel,
    @Query('category') category?: SpoilerCategory,
    @Query('chapterNumber', ParseIntPipe) chapterNumber?: number,
    @Query('isVerified') isVerified?: boolean,
    @Query('userChapterNumber', ParseIntPipe) userChapterNumber?: number,
  ): Promise<ChapterSpoiler[]> {
    return this.service.findAll({ level, category, chapterNumber, isVerified, userChapterNumber });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific chapter spoiler',
    description: 'Retrieve a single spoiler by its ID'
  })
  @ApiParam({ name: 'id', description: 'Spoiler ID', example: 1 })
  getOne(@Param('id', ParseIntPipe) id: number): Promise<ChapterSpoiler> {
    return this.service.findOne(id);
  }

  @Get('viewable/:userChapterNumber')
  @ApiOperation({
    summary: 'Get all spoilers viewable by user',
    description: 'Get all spoilers that are safe for the user to view based on their reading progress'
  })
  @ApiParam({ name: 'userChapterNumber', description: 'Highest chapter number the user has read', example: 15 })
  @ApiQuery({ name: 'level', required: false, enum: SpoilerLevel, description: 'Filter by spoiler level' })
  @ApiQuery({ name: 'category', required: false, enum: SpoilerCategory, description: 'Filter by spoiler category' })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status' })
  getViewableSpoilers(
    @Param('userChapterNumber', ParseIntPipe) userChapterNumber: number,
    @Query('level') level?: SpoilerLevel,
    @Query('category') category?: SpoilerCategory,
    @Query('isVerified') isVerified?: boolean,
  ): Promise<ChapterSpoiler[]> {
    return this.service.findViewableSpoilers(userChapterNumber, { level, category, isVerified });
  }

  @ApiOperation({
    summary: 'Check if user can view a spoiler',
    description: 'Determines if a user can view a specific spoiler based on their reading progress. Returns viewability status.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        spoilerId: { type: 'number', example: 1, description: 'ID of the spoiler to check' },
        userChapterNumber: { 
          type: 'number', 
          example: 15, 
          description: 'The highest chapter number the user has read' 
        }
      },
      required: ['spoilerId', 'userChapterNumber']
    }
  })
  @ApiOkResponse({
    description: 'Spoiler viewability determined',
    schema: {
      example: {
        viewable: true
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid spoiler ID or chapter IDs',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid spoiler ID',
        error: 'Bad Request'
      }
    }
  })
  @Post('check-viewable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  async checkSpoilerViewable(
    @Body('spoilerId', ParseIntPipe) spoilerId: number,
    @Body('userChapterNumber', ParseIntPipe) userChapterNumber: number,
  ): Promise<{ viewable: boolean }> {
    const viewable = await this.service.canViewSpoiler(spoilerId, userChapterNumber);
    return { viewable };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new chapter spoiler',
    description: 'Create a new spoiler with chapter number and optional chapter references with context (page numbers, etc.)'
  })
  @ApiCreatedResponse({
    description: 'Spoiler created successfully',
    schema: {
      example: {
        id: 1,
        content: 'Major character revelation occurs',
        level: 'MAJOR',
        category: 'CHARACTER_REVEAL',
        chapterNumber: 15,
        isVerified: false,
        chapterReferences: [
          { chapterNumber: 12, context: 'Page 8 - Character background' },
          { chapterNumber: 14, context: 'Final scene - Foreshadowing' }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    }
  })
  create(@Body() data: CreateChapterSpoilerDto): Promise<ChapterSpoiler> {
    return this.service.create(data);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify a chapter spoiler',
    description: 'Mark a spoiler as verified by moderators/admins'
  })
  @ApiParam({ name: 'id', description: 'Spoiler ID', example: 1 })
  async verify(@Param('id', ParseIntPipe) id: number): Promise<ChapterSpoiler> {
    return this.service.update(id, { isVerified: true });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a chapter spoiler',
    description: 'Update spoiler content, chapter number, chapter references, or other properties'
  })
  @ApiParam({ name: 'id', description: 'Spoiler ID', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: Partial<CreateChapterSpoilerDto>
  ): Promise<ChapterSpoiler> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a chapter spoiler',
    description: 'Permanently remove a spoiler from the database'
  })
  @ApiParam({ name: 'id', description: 'Spoiler ID', example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
