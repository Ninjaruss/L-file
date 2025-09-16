import { DataSource } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { Character } from '../../entities/character.entity';
import { Seeder } from './seeder.interface';

export class OrganizationSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const organizationRepository = this.dataSource.getRepository(Organization);
    const characterRepository = this.dataSource.getRepository(Character);

    // Get characters for organization associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame' },
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji' },
    });

    const organizations = [
      {
        name: 'Kakerou',
        description:
          'A secret organization that oversees high-stakes gambling and illegal activities. Members are bound by strict rules and face severe consequences for betrayal.',
        characters: baku && marco ? [baku, marco] : [],
      },
      {
        name: 'IDEAL',
        description:
          'A powerful criminal organization that operates various illegal businesses including gambling, smuggling, and information trading.',
        characters: [],
      },
      {
        name: 'Clan',
        description:
          'A yakuza organization involved in underground gambling and territorial disputes with other criminal groups.',
        characters: [],
      },
      {
        name: 'Independent Gamblers',
        description:
          "Freelance gamblers who don't belong to any specific organization but participate in underground gambling events.",
        characters: [],
      },
      {
        name: 'Police Force',
        description:
          'Law enforcement officers who are either investigating or secretly involved in the underground gambling world.',
        characters: [],
      },
    ];

    for (const organizationData of organizations) {
      const existingOrganization = await organizationRepository.findOne({
        where: { name: organizationData.name },
      });

      if (!existingOrganization) {
        await organizationRepository.save(organizationData);
      }
    }
  }
}
