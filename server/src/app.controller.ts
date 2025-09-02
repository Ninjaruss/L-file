import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PageViewsService,
  TrendingPage,
} from './modules/page-views/page-views.service';
import { PageType } from './entities/page-view.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Guide, GuideStatus } from './entities/guide.entity';
import { Character } from './entities/character.entity';
import { Event } from './entities/event.entity';
import { Gamble } from './entities/gamble.entity';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly pageViewsService: PageViewsService,
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Gamble)
    private readonly gambleRepository: Repository<Gamble>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get landing page data with trending content' })
  @ApiResponse({
    status: 200,
    description: 'Landing page data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        trending: {
          type: 'object',
          properties: {
            guides: { type: 'array' },
            characters: { type: 'array' },
            events: { type: 'array' },
            gambles: { type: 'array' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalGuides: { type: 'number' },
            totalCharacters: { type: 'number' },
            totalEvents: { type: 'number' },
            totalGambles: { type: 'number' },
          },
        },
      },
    },
  })
  async getLandingPageData(
    @Query('limit') limit: number = 5,
    @Query('daysBack') daysBack: number = 7,
  ) {
    // Get trending pages by type
    const trendingByType = await this.pageViewsService.getTrendingPagesByType(
      limit,
      daysBack,
    );

    // Get actual entity data for trending items
    const trendingGuides = await this.getGuideDetails(
      trendingByType[PageType.GUIDE] || [],
    );
    const trendingCharacters = await this.getCharacterDetails(
      trendingByType[PageType.CHARACTER] || [],
    );
    const trendingEvents = await this.getEventDetails(
      trendingByType[PageType.EVENT] || [],
    );
    const trendingGambles = await this.getGambleDetails(
      trendingByType[PageType.GAMBLE] || [],
    );

    // Get basic stats
    const [totalGuides, totalCharacters, totalEvents, totalGambles] =
      await Promise.all([
        this.guideRepository.count({
          where: { status: GuideStatus.PUBLISHED },
        }),
        this.characterRepository.count(),
        this.eventRepository.count(),
        this.gambleRepository.count(),
      ]);

    return {
      trending: {
        guides: trendingGuides,
        characters: trendingCharacters,
        events: trendingEvents,
        gambles: trendingGambles,
      },
      stats: {
        totalGuides,
        totalCharacters,
        totalEvents,
        totalGambles,
      },
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get overall trending pages' })
  @ApiResponse({
    status: 200,
    description: 'Trending pages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pageId: { type: 'number' },
          pageType: { type: 'string' },
          viewCount: { type: 'number' },
          recentViewCount: { type: 'number' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  })
  async getTrendingPages(
    @Query('limit') limit: number = 10,
    @Query('daysBack') daysBack: number = 7,
  ) {
    const trendingPages = await this.pageViewsService.getTrendingPages(
      undefined,
      limit,
      daysBack,
    );

    // Enrich with basic entity data
    const enrichedPages = await Promise.all(
      trendingPages.map(async (page) => {
        let title = '';
        let description = '';

        switch (page.pageType) {
          case PageType.GUIDE:
            const guide = await this.guideRepository.findOne({
              where: { id: page.pageId, status: GuideStatus.PUBLISHED },
              select: ['title', 'description'],
            });
            if (guide) {
              title = guide.title;
              description = guide.description;
            }
            break;
          case PageType.CHARACTER:
            const character = await this.characterRepository.findOne({
              where: { id: page.pageId },
              select: ['name', 'description'],
            });
            if (character) {
              title = character.name;
              description = character.description || '';
            }
            break;
          case PageType.EVENT:
            const event = await this.eventRepository.findOne({
              where: { id: page.pageId },
              select: ['title', 'description'],
            });
            if (event) {
              title = event.title;
              description = event.description || '';
            }
            break;
          case PageType.GAMBLE:
            const gamble = await this.gambleRepository.findOne({
              where: { id: page.pageId },
              select: ['name', 'rules'],
            });
            if (gamble) {
              title = gamble.name;
              description = gamble.rules || '';
            }
            break;
        }

        return {
          ...page,
          title,
          description,
        };
      }),
    );

    return enrichedPages;
  }

  private async getGuideDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const guideIds = trendingPages.map((p) => p.pageId);
    const guides = await this.guideRepository.find({
      where: { id: In(guideIds), status: GuideStatus.PUBLISHED },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        author: { id: true, username: true },
      },
    });

    return guides.map((guide) => {
      const trendingData = trendingPages.find((p) => p.pageId === guide.id);
      return {
        ...guide,
        viewCount: trendingData?.viewCount || 0,
        recentViewCount: trendingData?.recentViewCount || 0,
      };
    });
  }

  private async getCharacterDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const characterIds = trendingPages.map((p) => p.pageId);
    const characters = await this.characterRepository.find({
      where: { id: In(characterIds) },
      select: ['id', 'name', 'description'],
    });

    return characters.map((character) => {
      const trendingData = trendingPages.find((p) => p.pageId === character.id);
      return {
        ...character,
        viewCount: trendingData?.viewCount || 0,
        recentViewCount: trendingData?.recentViewCount || 0,
      };
    });
  }

  private async getEventDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const eventIds = trendingPages.map((p) => p.pageId);
    const events = await this.eventRepository.find({
      where: { id: In(eventIds) },
      select: ['id', 'title', 'description'],
    });

    return events.map((event) => {
      const trendingData = trendingPages.find((p) => p.pageId === event.id);
      return {
        ...event,
        viewCount: trendingData?.viewCount || 0,
        recentViewCount: trendingData?.recentViewCount || 0,
      };
    });
  }

  private async getGambleDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const gambleIds = trendingPages.map((p) => p.pageId);
    const gambles = await this.gambleRepository.find({
      where: { id: In(gambleIds) },
      select: ['id', 'name', 'rules'],
    });

    return gambles.map((gamble) => {
      const trendingData = trendingPages.find((p) => p.pageId === gamble.id);
      return {
        ...gamble,
        viewCount: trendingData?.viewCount || 0,
        recentViewCount: trendingData?.recentViewCount || 0,
      };
    });
  }
}
