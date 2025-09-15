import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BadgesService } from '../badges/badges.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly badgesService: BadgesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBadgeExpiration() {
    this.logger.log('Running daily badge expiration check...');
    try {
      const expiredCount = await this.badgesService.expireUserBadges();
      this.logger.log(`Successfully expired ${expiredCount} badges`);
    } catch (error) {
      this.logger.error('Failed to expire badges:', error);
    }
  }

  @Cron('0 0 1 * *') // First day of every month at midnight
  async monthlyBadgeReport() {
    this.logger.log('Running monthly badge statistics report...');
    try {
      // You can add monthly badge statistics here if needed
      this.logger.log('Monthly badge report completed');
    } catch (error) {
      this.logger.error('Failed to generate monthly badge report:', error);
    }
  }
}
