import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Badge, BadgeType } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { User } from '../../entities/user.entity';
import { CreateBadgeDto, UpdateBadgeDto } from './dto/badge.dto';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBadgeById(id: number): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({ where: { id } });
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    const badge = this.badgeRepository.create(data);
    return this.badgeRepository.save(badge);
  }

  async updateBadge(id: number, data: UpdateBadgeDto): Promise<Badge> {
    const badge = await this.findBadgeById(id);
    Object.assign(badge, data);
    return this.badgeRepository.save(badge);
  }

  async removeBadge(id: number): Promise<void> {
    const badge = await this.findBadgeById(id);
    await this.badgeRepository.remove(badge);
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId, isActive: true },
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getUserActiveBadges(userId: number): Promise<UserBadge[]> {
    const now = new Date();
    return this.userBadgeRepository.find({
      where: [
        { userId, isActive: true, expiresAt: IsNull() },
        { userId, isActive: true, expiresAt: MoreThan(now) },
      ],
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getAllUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge', 'revokedBy'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async awardBadge(
    userId: number,
    badgeId: number,
    reason?: string,
    awardedByUserId?: number,
    metadata?: any,
    year?: number,
    expiresAt?: string | Date,
  ): Promise<UserBadge> {
    this.logger.log(
      `Awarding badge ${badgeId} to user ${userId}. Reason: ${reason || 'Not specified'}`,
    );

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const badge = await this.findBadgeById(badgeId);

    const existingBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (existingBadge) {
      this.logger.warn(
        `User ${userId} already has active badge ${badgeId} (${badge.name})`,
      );
      throw new BadRequestException('User already has this active badge');
    }

    const finalExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const userBadge = this.userBadgeRepository.create({
      userId,
      badgeId,
      year: year ?? null,
      reason,
      awardedByUserId,
      metadata,
      expiresAt: finalExpiresAt,
    });

    const savedBadge = await this.userBadgeRepository.save(userBadge);
    this.logger.log(
      `Successfully awarded badge ${badge.name} to user ${user.username} (${userId})`,
    );

    return savedBadge;
  }

  async revokeBadge(
    userId: number,
    badgeId: number,
    reason?: string,
    revokedByUserId?: number,
  ): Promise<void> {
    const userBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (!userBadge) {
      throw new NotFoundException('Active user badge not found');
    }

    userBadge.isActive = false;
    userBadge.revokedAt = new Date();
    userBadge.revokedReason = reason || 'No reason provided';
    userBadge.revokedByUserId = revokedByUserId || null;

    await this.userBadgeRepository.save(userBadge);
  }

  async expireUserBadges(): Promise<number> {
    this.logger.log('Starting badge expiration check...');
    const now = new Date();
    const expiredBadges = await this.userBadgeRepository.find({
      where: {
        isActive: true,
        expiresAt: MoreThan(new Date('2000-01-01')),
      },
      relations: ['badge', 'user'],
    });

    let expiredCount = 0;
    for (const userBadge of expiredBadges) {
      if (userBadge.expiresAt && userBadge.expiresAt <= now) {
        userBadge.isActive = false;
        await this.userBadgeRepository.save(userBadge);
        expiredCount++;

        this.logger.log(
          `Expired badge ${userBadge.badge?.name} for user ${userBadge.user?.username} (${userBadge.userId})`,
        );
      }
    }

    this.logger.log(
      `Badge expiration check completed. Expired ${expiredCount} badges.`,
    );
    return expiredCount;
  }

  async getContributors(): Promise<any[]> {
    return this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoinAndSelect('userBadge.user', 'user')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('badge.type = :type', { type: BadgeType.CUSTOM })
      .andWhere('userBadge.isActive = :isActive', { isActive: true })
      .orderBy('userBadge.awardedAt', 'ASC')
      .getMany();
  }

  async getBadgeStatistics(): Promise<any> {
    this.logger.log('Generating badge statistics...');

    const badgeStats = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoin('userBadge.badge', 'badge')
      .select('badge.type', 'type')
      .addSelect('COUNT(userBadge.id)', 'count')
      .addSelect(
        'COUNT(CASE WHEN userBadge.isActive = true THEN 1 END)',
        'activeCount',
      )
      .where('userBadge.isActive = :isActive', { isActive: true })
      .groupBy('badge.type')
      .getRawMany();

    const soonToExpire = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .select('COUNT(userBadge.id)', 'count')
      .where('userBadge.isActive = :isActive', { isActive: true })
      .andWhere('userBadge.expiresAt BETWEEN :now AND :sevenDaysFromNow', {
        now: new Date(),
        sevenDaysFromNow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    const statistics = {
      badges: badgeStats,
      expiringIn7Days: parseInt(soonToExpire.count) || 0,
      generatedAt: new Date(),
    };

    this.logger.log('Badge statistics generated successfully');
    return statistics;
  }
}
