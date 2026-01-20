import { DataSource } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { Seeder } from './seeder.interface';

// Organizations from Usogui wiki
const organizations = [
  {
    name: "Usogui's Allies",
    description:
      'The group of allies who support Madarame Baku throughout his journey against Kakerou and other adversaries.',
  },
  {
    name: 'Kakerou',
    description:
      'A secret underground gambling organization that oversees high-stakes gambles with life-or-death consequences. Members are bound by strict rules and face severe penalties for betrayal.',
  },
  {
    name: 'Ideal',
    description:
      'A powerful international criminal organization led by Vincent Lalo that opposes Kakerou and seeks to expand its influence.',
  },
  {
    name: 'Protoporos Island',
    description:
      'The isolated island where the Protoporos arc takes place, home to various factions, games, and characters.',
  },
  {
    name: 'KY Declaration',
    description:
      'A TV show organization where a major arc takes place, featuring staff and panelists.',
  },
  {
    name: 'Butler Café: Hyakki Yakou',
    description:
      'A café owned by Yakou Hikoichi that serves as a meeting place and information hub.',
  },
  {
    name: 'Kurama-gumi',
    description:
      'A yakuza organization led by Kurama Ranko, involved in the underground world.',
  },
];

export class OrganizationSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const organizationRepository = this.dataSource.getRepository(Organization);

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
