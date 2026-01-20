import { DataSource } from 'typeorm';
import { CharacterOrganization } from '../../entities/character-organization.entity';
import { Character } from '../../entities/character.entity';
import { Organization } from '../../entities/organization.entity';
import { Seeder } from './seeder.interface';

// Character-Organization membership data with roles from the wiki
const memberships = [
  // Usogui's Allies
  {
    characterName: 'Madarame Baku',
    organizationName: "Usogui's Allies",
    role: 'Ally',
    startChapter: 1,
  },
  {
    characterName: 'Kaji Takaomi',
    organizationName: "Usogui's Allies",
    role: 'Ally',
    startChapter: 1,
  },
  {
    characterName: 'Marco',
    organizationName: "Usogui's Allies",
    role: 'Ally',
    startChapter: 1,
  },
  {
    characterName: 'Kyara',
    organizationName: "Usogui's Allies",
    role: 'Ally',
    startChapter: 1,
  },
  {
    characterName: 'Karl Belmont',
    organizationName: "Usogui's Allies",
    role: 'Ally',
    startChapter: 1,
  },

  // Kakerou Royal Leaders
  {
    characterName: 'Kiruma Kagerounosuke',
    organizationName: 'Kakerou',
    role: 'Royal Leader',
    startChapter: 1,
  },
  {
    characterName: 'Kiruma Souichi',
    organizationName: 'Kakerou',
    role: 'Royal Leader',
    startChapter: 1,
  },
  {
    characterName: 'Kiruma Tatsuki',
    organizationName: 'Kakerou',
    role: 'Royal Leader',
    startChapter: 1,
  },

  // Kakerou Referees
  {
    characterName: 'Yakou Hikoichi',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Nowa Mitoshi',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Nowa Mitora',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Nowa Mirei',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Nowa Shion',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Kadokura Yuudai',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Touya Masateru',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Ikon Jyuuzou',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Amen Makoto',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Douji Haruaki',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Nanpou Kyouji',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Bandai Kaoru',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Kushinada Tetsuma',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Makami Boro',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Makuro Souji',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Mekama Kirou',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Manabe Takumi',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Midara Yuusuke',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Mitaka Hana',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Mogami Taeko',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Sagita Souya',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Watari',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Kyara',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },
  {
    characterName: 'Kiruma Tatsuki',
    organizationName: 'Kakerou',
    role: 'Referee',
    startChapter: 1,
  },

  // Kakerou Other
  {
    characterName: 'Chris Lee',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Eba',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Gyoushuu',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Lóng',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Mizue Yuuko',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Nobuo',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Souma Chisato',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },
  {
    characterName: 'Yakou Jouichi',
    organizationName: 'Kakerou',
    role: 'Other',
    startChapter: 1,
  },

  // Kakerou Members
  {
    characterName: 'Fukurou',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Kaji Takaomi',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Kokonoe Tarou',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Kurama Ranko',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Madarame Baku',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Sadakuni Ikki',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Sakai (son)',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Suteguma Satoru',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },
  {
    characterName: 'Yukiide Kaoru',
    organizationName: 'Kakerou',
    role: 'Member',
    startChapter: 1,
  },

  // Ideal Members
  {
    characterName: 'Vincent Lalo',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Billy Craig',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Floyd Lee',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Gilbert Isaac',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Gyeongho Jonglyo',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Jack Repass',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Jones',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Kirsten Howard',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Martin Bruce Whyte',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Robert K',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Soda Maker',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Suteguma Satoru',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Torpe',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },
  {
    characterName: 'Voja',
    organizationName: 'Ideal',
    role: 'Member',
    startChapter: 73,
  },

  // Ideal Allies
  {
    characterName: 'Anoma',
    organizationName: 'Ideal',
    role: 'Ally',
    startChapter: 73,
  },
  {
    characterName: 'Bǎi Lóng (fake)',
    organizationName: 'Ideal',
    role: 'Ally',
    startChapter: 73,
  },
  {
    characterName: 'Bǎi Lóng (real)',
    organizationName: 'Ideal',
    role: 'Ally',
    startChapter: 73,
  },
  {
    characterName: 'Fukurou',
    organizationName: 'Ideal',
    role: 'Ally',
    startChapter: 73,
  },
  {
    characterName: 'Lacy',
    organizationName: 'Ideal',
    role: 'Ally',
    startChapter: 73,
  },

  // Protoporos Island
  {
    characterName: 'Richard Arata',
    organizationName: 'Protoporos Island',
    role: 'Original Creator',
    startChapter: 329,
  },
  {
    characterName: 'Daiba Hiromi',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'Endou',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'Fujitsubo',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'Kurashiki',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'Mako',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'Oginome',
    organizationName: 'Protoporos Island',
    role: 'Developer',
    startChapter: 329,
  },
  {
    characterName: 'AAAA',
    organizationName: 'Protoporos Island',
    role: 'Co-ordinator',
    startChapter: 329,
  },
  {
    characterName: 'Abiru',
    organizationName: 'Protoporos Island',
    role: 'Co-ordinator',
    startChapter: 329,
  },
  {
    characterName: 'Arahata',
    organizationName: 'Protoporos Island',
    role: 'Co-ordinator',
    startChapter: 329,
  },
  {
    characterName: 'Veronica',
    organizationName: 'Protoporos Island',
    role: 'Co-ordinator',
    startChapter: 329,
  },
  {
    characterName: 'Daiguuji',
    organizationName: 'Protoporos Island',
    role: 'Other Staff',
    startChapter: 329,
  },
  {
    characterName: 'Perpes',
    organizationName: 'Protoporos Island',
    role: 'Other Staff',
    startChapter: 329,
  },
  {
    characterName: 'Richard Arata (fake)',
    organizationName: 'Protoporos Island',
    role: 'Outlaw',
    startChapter: 329,
  },
  {
    characterName: 'Raoh',
    organizationName: 'Protoporos Island',
    role: 'Outlaw',
    startChapter: 329,
  },

  // KY Declaration
  {
    characterName: 'Director Madarame',
    organizationName: 'KY Declaration',
    role: 'Staff',
    startChapter: 178,
  },
  {
    characterName: 'Oshima Kenta',
    organizationName: 'KY Declaration',
    role: 'Staff',
    startChapter: 178,
  },
  {
    characterName: 'Kaneko Shimao',
    organizationName: 'KY Declaration',
    role: 'Staff',
    startChapter: 178,
  },
  {
    characterName: 'Mii-chan',
    organizationName: 'KY Declaration',
    role: 'Staff',
    startChapter: 178,
  },
  {
    characterName: 'Kaomi Takaji',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },
  {
    characterName: 'Karasuyama Takashi',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },
  {
    characterName: 'Matsuyama Senkichi',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },
  {
    characterName: 'Nitro Masaru',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },
  {
    characterName: 'Takeda Kazushige',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },
  {
    characterName: 'Yoshino Hideki',
    organizationName: 'KY Declaration',
    role: 'Panelist',
    startChapter: 178,
  },

  // Butler Café: Hyakki Yakou
  {
    characterName: 'Yakou Hikoichi',
    organizationName: 'Butler Café: Hyakki Yakou',
    role: 'Owner',
    startChapter: 1,
  },

  // Kurama-gumi
  {
    characterName: 'Kurama Ranko',
    organizationName: 'Kurama-gumi',
    role: 'Leader',
    startChapter: 1,
  },
  {
    characterName: 'Kurama',
    organizationName: 'Kurama-gumi',
    role: 'Previous Leader',
    startChapter: 1,
  },
  {
    characterName: 'Hyougo',
    organizationName: 'Kurama-gumi',
    role: 'Member',
    startChapter: 1,
  },
];

export class CharacterOrganizationSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const characterOrgRepository = this.dataSource.getRepository(
      CharacterOrganization,
    );
    const characterRepository = this.dataSource.getRepository(Character);
    const organizationRepository = this.dataSource.getRepository(Organization);

    // Build lookup maps for faster access
    const characters = await characterRepository.find();
    const organizations = await organizationRepository.find();

    const characterMap = new Map<string, Character>();
    for (const character of characters) {
      characterMap.set(character.name, character);
    }

    const organizationMap = new Map<string, Organization>();
    for (const organization of organizations) {
      organizationMap.set(organization.name, organization);
    }

    // Create character-organization memberships
    for (const membership of memberships) {
      const character = characterMap.get(membership.characterName);
      const organization = organizationMap.get(membership.organizationName);

      if (!character) {
        console.warn(`Character not found: ${membership.characterName}`);
        continue;
      }

      if (!organization) {
        console.warn(`Organization not found: ${membership.organizationName}`);
        continue;
      }

      // Check if this membership already exists
      const existingMembership = await characterOrgRepository.findOne({
        where: {
          characterId: character.id,
          organizationId: organization.id,
          role: membership.role,
        },
      });

      if (!existingMembership) {
        await characterOrgRepository.save({
          characterId: character.id,
          organizationId: organization.id,
          role: membership.role,
          startChapter: membership.startChapter,
          spoilerChapter: membership.startChapter,
        });
      }
    }
  }
}
