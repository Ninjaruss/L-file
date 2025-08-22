import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GamblesService } from './gambles.service';
import { CreateGambleDto } from './dtos/create-gamble.dto';
import { Gamble } from '../../entities/gamble.entity';

@ApiTags('Gambles')
@Controller('gambles')
export class GamblesController {
  constructor(private readonly gamblesService: GamblesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new gamble',
    description: 'Create a new gamble with teams, rounds, and observers'
  })
  @ApiResponse({
    status: 201,
    description: 'The gamble has been successfully created',
    type: Gamble
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (e.g., less than 2 teams)'
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter or Character not found'
  })
  create(@Body() createGambleDto: CreateGambleDto): Promise<Gamble> {
    return this.gamblesService.create(createGambleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all gambles',
    description: 'Retrieve all gambles with their teams, rounds, and observers'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all gambles',
    type: [Gamble]
  })
  findAll(): Promise<Gamble[]> {
    return this.gamblesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific gamble',
    description: 'Retrieve a gamble by ID with its teams, rounds, and observers'
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the gamble to retrieve',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'The found gamble',
    type: Gamble
  })
  @ApiResponse({
    status: 404,
    description: 'Gamble not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Gamble> {
    return this.gamblesService.findOne(id);
  }

  @Get('chapter/:chapterId')
  @ApiOperation({
    summary: 'Get gambles by chapter',
    description: 'Retrieve all gambles that occurred in a specific chapter'
  })
  @ApiParam({
    name: 'chapterId',
    description: 'ID of the chapter to find gambles for',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'List of gambles in the chapter',
    type: [Gamble]
  })
  findByChapter(@Param('chapterId', ParseIntPipe) chapterId: number): Promise<Gamble[]> {
    return this.gamblesService.findByChapter(chapterId);
  }

  @Get('character/:characterId')
  @ApiOperation({
    summary: 'Get gambles by character',
    description: 'Retrieve all gambles where a character participated or observed'
  })
  @ApiParam({
    name: 'characterId',
    description: 'ID of the character to find gambles for',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'List of gambles involving the character',
    type: [Gamble]
  })
  findByCharacter(@Param('characterId', ParseIntPipe) characterId: number): Promise<Gamble[]> {
    return this.gamblesService.findByCharacter(characterId);
  }
}
