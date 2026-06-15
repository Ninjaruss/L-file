import { DataSource } from 'typeorm';
import { Badge, BadgeType } from '../../entities/badge.entity';

export async function seedBadges(dataSource: DataSource): Promise<void> {
  const badgeRepository = dataSource.getRepository(Badge);

  // Check if badges already exist
  const existingBadges = await badgeRepository.count();
  if (existingBadges > 0) {
    console.log('Badges already exist, skipping seed...');
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
      description: 'Helped test new features',
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
      description: 'Created exceptional guides or content',
      type: BadgeType.CUSTOM,
      icon: '✍️',
      color: '#20B2AA',
      backgroundColor: '#2F4F4F',
      displayOrder: 12,
      isActive: true,
      isManuallyAwardable: true,
    },
  ];

  await badgeRepository.save(badges);
  console.log(`Seeded ${badges.length} badges`);
}
