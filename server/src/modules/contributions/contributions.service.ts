import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { Media, MediaStatus } from '../../entities/media.entity';
import { Annotation, AnnotationStatus } from '../../entities/annotation.entity';
import { Quote } from '../../entities/quote.entity';
import { User } from '../../entities/user.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { createQueryLimiter } from '../../utils/db-query-limiter';

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Guide)
    private guideRepository: Repository<Guide>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private editLogService: EditLogService,
  ) {}

  async getUserContributions(userId: number): Promise<{
    userId: number;
    username: string;
    submissions: {
      guides: number;
      media: number;
      annotations: number;
      quotes: number;
      total: number;
    };
    edits: {
      characters: number;
      gambles: number;
      arcs: number;
      organizations: number;
      events: number;
      total: number;
    };
    totalContributions: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Limit to 3 concurrent queries to prevent connection pool exhaustion
    const limiter = createQueryLimiter(3);

    const [guidesCount, mediaCount, annotationsCount, quotesCount] =
      await Promise.all([
        limiter(() =>
          this.guideRepository.count({
            where: { authorId: userId, status: GuideStatus.APPROVED },
          }),
        ),
        limiter(() =>
          this.mediaRepository
            .createQueryBuilder('media')
            .where('media.submittedById = :userId', { userId })
            .andWhere('media.status = :status', {
              status: MediaStatus.APPROVED,
            })
            .getCount(),
        ),
        limiter(() =>
          this.annotationRepository.count({
            where: { authorId: userId, status: AnnotationStatus.APPROVED },
          }),
        ),
        limiter(() =>
          this.quoteRepository
            .createQueryBuilder('quote')
            .where('quote.submittedById = :userId', { userId })
            .getCount(),
        ),
      ]);

    const submissionsTotal =
      guidesCount + mediaCount + annotationsCount + quotesCount;

    const editCounts =
      await this.editLogService.getEditCountByUserGrouped(userId);
    const editsTotal = Object.values(editCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      userId,
      username: user.username,
      submissions: {
        guides: guidesCount,
        media: mediaCount,
        annotations: annotationsCount,
        quotes: quotesCount,
        total: submissionsTotal,
      },
      edits: {
        characters: editCounts.character,
        gambles: editCounts.gamble,
        arcs: editCounts.arc,
        organizations: editCounts.organization,
        events: editCounts.event,
        total: editsTotal,
      },
      totalContributions: submissionsTotal + editsTotal,
    };
  }

  async getTotalContributionCount(userId: number): Promise<number> {
    const contributions = await this.getUserContributions(userId);
    return contributions.totalContributions;
  }

  async getUserContributionDetails(userId: number): Promise<{
    guides: Array<{
      id: number;
      title: string;
      status: string;
      createdAt: Date;
    }>;
    media: Array<{
      id: string;
      description: string;
      url: string;
      ownerType: string;
      status: string;
      createdAt: Date;
    }>;
    annotations: Array<{
      id: number;
      title: string;
      ownerType: string;
      ownerId: number;
      status: string;
      createdAt: Date;
    }>;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Limit to 3 concurrent queries to prevent connection pool exhaustion
    const limiter = createQueryLimiter(3);

    const [guides, media, annotations] = await Promise.all([
      limiter(() =>
        this.guideRepository.find({
          where: { authorId: userId },
          select: ['id', 'title', 'status', 'createdAt'],
          order: { createdAt: 'DESC' },
          take: 50,
        }),
      ),
      limiter(() =>
        this.mediaRepository
          .createQueryBuilder('media')
          .select([
            'media.id',
            'media.description',
            'media.url',
            'media.ownerType',
            'media.status',
            'media.createdAt',
          ])
          .where('media.submittedById = :userId', { userId })
          .orderBy('media.createdAt', 'DESC')
          .take(50)
          .getMany(),
      ),
      limiter(() =>
        this.annotationRepository.find({
          where: { authorId: userId },
          select: [
            'id',
            'title',
            'ownerType',
            'ownerId',
            'status',
            'createdAt',
          ],
          order: { createdAt: 'DESC' },
          take: 50,
        }),
      ),
    ]);

    return {
      guides: guides.map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status,
        createdAt: g.createdAt,
      })),
      media: media.map((m) => ({
        id: m.id,
        description: m.description || '',
        url: m.url,
        ownerType: m.ownerType,
        status: m.status,
        createdAt: m.createdAt,
      })),
      annotations: annotations.map((a) => ({
        id: a.id,
        title: a.title,
        ownerType: a.ownerType,
        ownerId: a.ownerId,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  }
}
