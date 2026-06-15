import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { Badge, BadgeType } from '../../entities/badge.entity';

export class BadgeSeeder implements Seeder {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<void> {
    const badgeRepository = this.dataSource.getRepository(Badge);

    // Check if badges already exist
    const existingBadges = await badgeRepository.count();
    if (existingBadges > 0) {
      console.log('🏷️  Badges already exist, skipping seed...');
      return;
    }

    const badges = [
      {
        name: 'Community Hero',
        description: 'Outstanding contribution to the community',
        type: BadgeType.CUSTOM,
        icon: '🏆',
        color: '#FFA500',
        backgroundColor: '#8B0000',
        displayOrder: 10,
        isActive: true,
        isManuallyAwardable: true,
      },
      {
        name: 'Beta Tester',
        description: 'Helped test new features and improvements',
        type: BadgeType.CUSTOM,
        icon: '🧪',
        color: '#9370DB',
        backgroundColor: '#191970',
        displayOrder: 11,
        isActive: true,
        isManuallyAwardable: true,
      },
      {
        name: 'Content Creator',
        description: 'Created exceptional guides, media, or content',
        type: BadgeType.CUSTOM,
        icon: '✍️',
        color: '#20B2AA',
        backgroundColor: '#2F4F4F',
        displayOrder: 12,
        isActive: true,
        isManuallyAwardable: true,
      },
      {
        name: 'Early Supporter',
        description: 'Supported the site in its early days',
        type: BadgeType.CUSTOM,
        icon: '🌟',
        color: '#FFB6C1',
        backgroundColor: '#8B008B',
        displayOrder: 13,
        isActive: true,
        isManuallyAwardable: true,
      },
    ];

    await badgeRepository.save(badges);
    console.log(`🏷️  Seeded ${badges.length} badges successfully`);
  }
}
