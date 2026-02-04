import { DataSource } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { Seeder } from './seeder.interface';

// Characters data from Usogui wiki
const characters = [
  // Usogui's Allies
  {
    name: 'Madarame Baku',
    alternateNames: ['Usogui', 'The Lie Eater'],
    description:
      'The main protagonist, a genius gambler known as "Usogui" (The Lie Eater) for his ability to detect lies and manipulate situations.',
    firstAppearanceChapter: 1,
  },
  {
    name: 'Kaji Takaomi',
    alternateNames: ['Kaji'],
    description:
      "Baku's closest ally and friend who becomes deeply involved in Kakerou's world.",
    firstAppearanceChapter: 1,
  },
  {
    name: 'Marco',
    alternateNames: [],
    description: 'A skilled ally who assists Baku throughout his journey.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kyara',
    alternateNames: [],
    description: "A Kakerou referee and one of Baku's trusted allies.",
    firstAppearanceChapter: null,
  },
  {
    name: 'Karl Belmont',
    alternateNames: [],
    description: "A foreign ally who joins Baku's group.",
    firstAppearanceChapter: null,
  },

  // Kakerou Royal Leaders
  {
    name: 'Kiruma Kagerounosuke',
    alternateNames: ['Leader'],
    description: 'The supreme leader of Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kiruma Souichi',
    alternateNames: ['Souichi'],
    description: 'One of the Kakerou royal leaders.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kiruma Tatsuki',
    alternateNames: ['Tatsuki'],
    description: 'One of the Kakerou royal leaders, also serves as a referee.',
    firstAppearanceChapter: null,
  },

  // Kakerou Referees
  {
    name: 'Yakou Hikoichi',
    alternateNames: [],
    description: 'A Kakerou referee and owner of Butler Café: Hyakki Yakou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nowa Mitoshi',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nowa Mitora',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nowa Mirei',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nowa Shion',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kadokura Yuudai',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Touya Masateru',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Ikon Jyuuzou',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Amen Makoto',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Douji Haruaki',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nanpou Kyouji',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Bandai Kaoru',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kushinada Tetsuma',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Makami Boro',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Makuro Souji',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mekama Kirou',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Manabe Takumi',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Midara Yuusuke',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mitaka Hana',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mogami Taeko',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Sagita Souya',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Watari',
    alternateNames: [],
    description: 'A Kakerou referee.',
    firstAppearanceChapter: null,
  },

  // Kakerou Other
  {
    name: 'Chris Lee',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Eba',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Gyoushuu',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Lóng',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mizue Yuuko',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nobuo',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Souma Chisato',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Yakou Jouichi',
    alternateNames: [],
    description: 'Associated with Kakerou.',
    firstAppearanceChapter: null,
  },

  // Kakerou Members
  {
    name: 'Fukurou',
    alternateNames: [],
    description: 'A Kakerou member.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kokonoe Tarou',
    alternateNames: [],
    description: 'A Kakerou member.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kurama Ranko',
    alternateNames: [],
    description: 'A Kakerou member and leader of the Kurama-gumi.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Sadakuni Ikki',
    alternateNames: [],
    description: 'A formidable Kakerou member.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Sakai (son)',
    alternateNames: [],
    description: 'A Kakerou member.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Suteguma Satoru',
    alternateNames: [],
    description: 'A Kakerou member.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Yukiide Kaoru',
    alternateNames: [],
    description: 'A Kakerou member.',
    firstAppearanceChapter: null,
  },

  // Ideal Members
  {
    name: 'Vincent Lalo',
    alternateNames: ['Lalo'],
    description: 'The leader of the Ideal organization.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Billy Craig',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Floyd Lee',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Gilbert Isaac',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Gyeongho Jonglyo',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Jack Repass',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Jones',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kirsten Howard',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Martin Bruce Whyte',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Robert K',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Soda Maker',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Torpe',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Voja',
    alternateNames: [],
    description: 'A member of Ideal.',
    firstAppearanceChapter: null,
  },

  // Ideal Allies
  {
    name: 'Anoma',
    alternateNames: [],
    description: 'An ally of Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Bǎi Lóng (fake)',
    alternateNames: [],
    description: 'A fake identity allied with Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Bǎi Lóng (real)',
    alternateNames: [],
    description: 'The real Bǎi Lóng, allied with Ideal.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Lacy',
    alternateNames: [],
    description: 'An ally of Ideal.',
    firstAppearanceChapter: null,
  },

  // Protoporos Island
  {
    name: 'Richard Arata',
    alternateNames: [],
    description: 'The original creator of Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Daiba Hiromi',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Endou',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Fujitsubo',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kurashiki',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mako',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Oginome',
    alternateNames: [],
    description: 'A developer on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'AAAA',
    alternateNames: [],
    description: 'A co-ordinator on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Abiru',
    alternateNames: [],
    description: 'A co-ordinator on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Arahata',
    alternateNames: [],
    description: 'A co-ordinator on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Veronica',
    alternateNames: [],
    description: 'A co-ordinator on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Daiguuji',
    alternateNames: [],
    description: 'Other staff on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Perpes',
    alternateNames: [],
    description: 'Other staff on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Richard Arata (fake)',
    alternateNames: [],
    description: 'A fake Richard Arata, an outlaw on Protoporos Island.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Raoh',
    alternateNames: [],
    description: 'An outlaw on Protoporos Island.',
    firstAppearanceChapter: null,
  },

  // KY Declaration
  {
    name: 'Director Madarame',
    alternateNames: [],
    description: 'Staff member of the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Oshima Kenta',
    alternateNames: [],
    description: 'Staff member of the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kaneko Shimao',
    alternateNames: [],
    description: 'Staff member of the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Mii-chan',
    alternateNames: [],
    description: 'Staff member of the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Kaomi Takaji',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Karasuyama Takashi',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Matsuyama Senkichi',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Nitro Masaru',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Takeda Kazushige',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Yoshino Hideki',
    alternateNames: [],
    description: 'Panelist on the KY Declaration TV show.',
    firstAppearanceChapter: null,
  },

  // Kurama-gumi
  {
    name: 'Kurama',
    alternateNames: [],
    description: 'Previous leader of the Kurama-gumi.',
    firstAppearanceChapter: null,
  },
  {
    name: 'Hyougo',
    alternateNames: [],
    description: 'A member of the Kurama-gumi.',
    firstAppearanceChapter: null,
  },
];

export class CharacterSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const characterRepository = this.dataSource.getRepository(Character);

    // Get all existing character names in a single query
    const existingNames = new Set(
      (
        await characterRepository
          .createQueryBuilder('c')
          .select('c.name')
          .getMany()
      ).map((c) => c.name),
    );

    // Filter out characters that already exist
    const newCharacters = characters.filter(
      (char) => !existingNames.has(char.name),
    );

    if (newCharacters.length === 0) {
      console.log('All characters already exist, skipping...');
      return;
    }

    console.log(
      `Inserting ${newCharacters.length} new characters in batches...`,
    );

    // Batch insert - 500 records at a time
    const batchSize = 500;
    for (let i = 0; i < newCharacters.length; i += batchSize) {
      const batch = newCharacters.slice(i, i + batchSize);
      await characterRepository.save(batch, { chunk: 100 });
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newCharacters.length / batchSize)}`,
      );
    }

    console.log(`Successfully inserted ${newCharacters.length} characters`);
  }
}
