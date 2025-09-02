import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { PageViewsService, TrendingPage } from './page-views.service';
import { PageType } from '../../entities/page-view.entity';

@ApiTags('page-views')
@Controller('page-views')
export class PageViewsController {
  constructor(private readonly pageViewsService: PageViewsService) {}

  @Post(':pageType/:pageId/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a page view' })
  @ApiParam({
    name: 'pageType',
    enum: PageType,
    description: 'Type of page being viewed',
  })
  @ApiParam({
    name: 'pageId',
    type: 'number',
    description: 'ID of the page being viewed',
  })
  @ApiResponse({ status: 204, description: 'View recorded successfully' })
  async recordView(
    @Param('pageType') pageType: PageType,
    @Param('pageId') pageId: number,
    @Req() request: Request,
  ): Promise<void> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    await this.pageViewsService.recordView(
      pageType,
      pageId,
      ipAddress,
      userAgent,
    );
  }

  @Get(':pageType/:pageId/count')
  @ApiOperation({ summary: 'Get view count for a specific page' })
  @ApiParam({
    name: 'pageType',
    enum: PageType,
    description: 'Type of page',
  })
  @ApiParam({
    name: 'pageId',
    type: 'number',
    description: 'ID of the page',
  })
  @ApiResponse({
    status: 200,
    description: 'View count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        viewCount: { type: 'number', example: 42 },
      },
    },
  })
  async getViewCount(
    @Param('pageType') pageType: PageType,
    @Param('pageId') pageId: number,
  ): Promise<{ viewCount: number }> {
    const viewCount = await this.pageViewsService.getViewCount(
      pageType,
      pageId,
    );
    return { viewCount };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending pages across all types' })
  @ApiResponse({
    status: 200,
    description: 'Trending pages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pageId: { type: 'number', example: 123 },
          pageType: { type: 'string', enum: Object.values(PageType) },
          viewCount: { type: 'number', example: 42 },
          recentViewCount: { type: 'number', example: 15 },
        },
      },
    },
  })
  async getTrendingPages(
    @Query('pageType') pageType?: PageType,
    @Query('limit') limit?: number,
    @Query('daysBack') daysBack?: number,
  ): Promise<TrendingPage[]> {
    return this.pageViewsService.getTrendingPages(pageType, limit, daysBack);
  }

  @Get('trending/by-type')
  @ApiOperation({ summary: 'Get trending pages grouped by type' })
  @ApiResponse({
    status: 200,
    description: 'Trending pages by type retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pageId: { type: 'number', example: 123 },
            pageType: { type: 'string', enum: Object.values(PageType) },
            viewCount: { type: 'number', example: 42 },
            recentViewCount: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  async getTrendingPagesByType(
    @Query('limit') limit?: number,
    @Query('daysBack') daysBack?: number,
  ): Promise<Record<PageType, TrendingPage[]>> {
    return this.pageViewsService.getTrendingPagesByType(limit, daysBack);
  }
}
