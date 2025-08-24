import { DataSource } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class CharacterSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const characterRepository = this.dataSource.getRepository(Character);
    const seriesRepository = this.dataSource.getRepository(Series);

    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    const initialCharacters = [
      {
        name: 'Baku Madarame',
        alternateNames: ['The Lie Eater', 'Mad Dog'],
        description: 'The main protagonist, known for his ability to see through deception and his exceptional gambling skills. Baku has an uncanny ability to detect lies and uses this to his advantage in high-stakes gambling scenarios.',
        firstAppearanceChapter: 1,
        series: { id: series.id } as Series,
        roles: ['Kakerou Member', 'Professional Gambler', 'Lie Detector']
      },
      {
        name: 'Marco Reiji',
        alternateNames: ['The Young Gun'],
        description: 'A skilled gambler who becomes one of Baku\'s closest allies. Marco is known for his strategic thinking and unwavering loyalty to his friends.',
        firstAppearanceChapter: 5,
        series: { id: series.id } as Series,
        roles: ['Professional Gambler', 'Strategist']
      },
      {
        name: 'Kyara Kujaku',
        alternateNames: ['The Broker'],
        description: 'A cunning information broker who plays multiple sides. Known for his manipulative nature and extensive network of contacts in the underground world.',
        firstAppearanceChapter: 8,
        series: { id: series.id } as Series,
        roles: ['Information Broker', 'Manipulator']
      },
      {
        name: 'Sadakuni Ikki',
        alternateNames: ['Leader'],
        description: 'The leader of Kakerou, a mysterious and powerful figure who oversees the organization\'s operations and maintains order in the underground gambling world.',
        firstAppearanceChapter: 12,
        series: { id: series.id } as Series,
        roles: ['Kakerou Leader', 'Organization Head']
      },
      {
        name: 'Hal Arimura',
        alternateNames: ['The Calculator'],
        description: 'A mathematical genius who excels at games requiring complex calculations and probability analysis. Often serves as an advisor in strategic situations.',
        firstAppearanceChapter: 15,
        series: { id: series.id } as Series,
        roles: ['Mathematician', 'Strategic Advisor']
      },
      {
        name: 'Mako Obara',
        alternateNames: ['The Analyst'],
        description: 'A careful observer and analyst who supports Baku\'s team with detailed analysis of opponents and situations.',
        firstAppearanceChapter: 20,
        series: { id: series.id } as Series,
        roles: ['Analyst', 'Support Member']
      },
      {
        name: 'Yakou Hikoichi',
        alternateNames: ['Night Owl'],
        description: 'A night-dwelling gambler with expertise in underground networks and nocturnal gambling events.',
        firstAppearanceChapter: 25,
        series: { id: series.id } as Series,
        roles: ['Underground Contact', 'Night Gambler']
      },
      {
        name: 'Fukurou Tsukiyo',
        alternateNames: ['The Owl'],
        description: 'A mysterious figure known for appearing at crucial moments with valuable information or assistance.',
        firstAppearanceChapter: 30,
        series: { id: series.id } as Series,
        roles: ['Information Source', 'Mysterious Ally']
      }
    ];

    for (const characterData of initialCharacters) {
      const existingCharacter = await characterRepository.findOne({
        where: { 
          name: characterData.name,
          series: { id: series.id }
        }
      });

      if (!existingCharacter) {
        await characterRepository.save(characterData);
      }
    }
  }
}
