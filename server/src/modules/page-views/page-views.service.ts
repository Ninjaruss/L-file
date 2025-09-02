import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView, PageType } from '../../entities/page-view.entity';

export interface TrendingPage {
  pageId: number;
  pageType: PageType;
  viewCount: number;
  recentViewCount: number;
}

@Injectable()
export class PageViewsService {
  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
  ) {}

  async recordView(
    pageType: PageType,
    pageId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const pageView = this.pageViewRepository.create({
      pageType,
      pageId,
      ipAddress,
      userAgent,
    });

    await this.pageViewRepository.save(pageView);
  }

  async getViewCount(pageType: PageType, pageId: number): Promise<number> {
    return this.pageViewRepository.count({
      where: {
        pageType,
        pageId,
      },
    });
  }

  async getViewCounts(
    pageType: PageType,
    pageIds: number[],
  ): Promise<Map<number, number>> {
    const results = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.pageId', 'page_id')
      .addSelect('COUNT(*)', 'view_count')
      .where('pv.pageType = :pageType', { pageType })
      .andWhere('pv.pageId IN (:...pageIds)', { pageIds })
      .groupBy('pv.pageId')
      .getRawMany();

    const viewCounts = new Map<number, number>();
    results.forEach((result) => {
      viewCounts.set(result.page_id, parseInt(result.view_count));
    });

    // Set 0 for pageIds that have no views
    pageIds.forEach((pageId) => {
      if (!viewCounts.has(pageId)) {
        viewCounts.set(pageId, 0);
      }
    });

    return viewCounts;
  }

  async getTrendingPages(
    pageType?: PageType,
    limit: number = 10,
    daysBack: number = 7,
  ): Promise<TrendingPage[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    let query = this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.pageId', 'page_id')
      .addSelect('pv.pageType', 'page_type')
      .addSelect('COUNT(*)', 'view_count')
      .addSelect(
        `COUNT(CASE WHEN pv.createdAt >= :dateThreshold THEN 1 END)`,
        'recent_view_count',
      )
      .groupBy('pv.pageId, pv.pageType')
      .orderBy('recent_view_count', 'DESC')
      .addOrderBy('view_count', 'DESC')
      .limit(limit)
      .setParameter('dateThreshold', dateThreshold);

    if (pageType) {
      query = query.where('pv.pageType = :pageType', { pageType });
    }

    const results = await query.getRawMany();

    return results.map((result) => ({
      pageId: result.page_id,
      pageType: result.page_type,
      viewCount: parseInt(result.view_count),
      recentViewCount: parseInt(result.recent_view_count),
    }));
  }

  async getTrendingPagesByType(
    limit: number = 5,
    daysBack: number = 7,
  ): Promise<Record<PageType, TrendingPage[]>> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    const results = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.pageId', 'page_id')
      .addSelect('pv.pageType', 'page_type')
      .addSelect('COUNT(*)', 'view_count')
      .addSelect(
        `COUNT(CASE WHEN pv.createdAt >= :dateThreshold THEN 1 END)`,
        'recent_view_count',
      )
      .groupBy('pv.pageId, pv.pageType')
      .orderBy('pv.pageType')
      .addOrderBy('recent_view_count', 'DESC')
      .addOrderBy('view_count', 'DESC')
      .setParameter('dateThreshold', dateThreshold)
      .getRawMany();

    const trendingByType: Record<PageType, TrendingPage[]> = {} as Record<
      PageType,
      TrendingPage[]
    >;

    // Initialize all page types
    Object.values(PageType).forEach((type) => {
      trendingByType[type] = [];
    });

    // Group results by page type and limit each
    results.forEach((result) => {
      const pageType = result.page_type as PageType;
      if (trendingByType[pageType] && trendingByType[pageType].length < limit) {
        trendingByType[pageType].push({
          pageId: result.page_id,
          pageType: result.page_type,
          viewCount: parseInt(result.view_count),
          recentViewCount: parseInt(result.recent_view_count),
        });
      }
    });

    return trendingByType;
  }
}
