import { DataSource } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Series } from '../../entities/series.entity';
import { Arc } from '../../entities/arc.entity';
import { Seeder } from './seeder.interface';

export class ChapterSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    try {
      const chapterRepository = this.dataSource.getRepository(Chapter);
      const seriesRepository = this.dataSource.getRepository(Series);
      const arcRepository = this.dataSource.getRepository(Arc);

      // Get the Usogui series
      const series = await seriesRepository.findOne({
        where: { name: 'Usogui' }
      });

      if (!series) {
        throw new Error('Series not found. Please run SeriesSeeder first.');
      }

      // Get the Introduction Arc
      const introArc = await arcRepository.findOne({
        where: { name: 'Introduction Arc' }
      });

      if (!introArc) {
        throw new Error('Introduction Arc not found. Please run ArcSeeder first.');
      }

      const initialChapters = [
        {
          number: 1,
          title: 'The Lie Eater',
          summary: 'Introduction to Baku Madarame, a young man with the supernatural ability to detect lies. He enters the dangerous world of underground gambling through the mysterious organization known as Kakerou.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 2,
          title: 'First Gamble',
          summary: 'Baku takes on his first opponent in a high-stakes match, demonstrating his lie detection abilities and strategic thinking in a deadly game.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 3,
          title: 'The Rules of Engagement',
          summary: 'The complex rules and hierarchy of underground gambling are revealed. Baku learns about the serious consequences of failure in this world.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 4,
          title: 'Stakes Rise',
          summary: 'The stakes escalate as Baku faces increasingly dangerous opponents. The true nature of life-or-death gambling begins to show.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 5,
          title: 'Meeting Marco',
          summary: 'Baku encounters Marco Reiji, a skilled gambler who becomes an important ally. Their partnership begins to form.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 6,
          title: 'Trust and Betrayal',
          summary: 'The theme of trust becomes central as Baku navigates relationships in a world where betrayal can be fatal.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 7,
          title: 'Psychological Warfare',
          summary: 'Baku demonstrates his mastery of psychological manipulation, using his lie detection to gain advantages in complex games.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 8,
          title: 'The Broker Appears',
          summary: 'Introduction to Kyara Kujaku, the information broker who plays multiple sides and adds complexity to the underground network.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 9,
          title: 'Double-Edged Games',
          summary: 'A complex gamble with multiple layers of deception tests Baku\'s abilities to their limits.',
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 10,
          title: 'End of Innocence',
          summary: 'The conclusion of the introduction arc. Baku fully commits to the dangerous path of underground gambling, understanding there\'s no turning back.',
          series: { id: series.id },
          arc: { id: introArc.id }
        }
      ];

      // Create chapters
      for (const chapterData of initialChapters) {
        const existingChapter = await chapterRepository.findOne({
          where: { 
            number: chapterData.number,
            series: { id: series.id }
          }
        });

        if (!existingChapter) {
          console.log(`Creating chapter ${chapterData.number}: ${chapterData.title}`);
          await chapterRepository.save(
            chapterRepository.create(chapterData)
          );
        } else {
          console.log(`Chapter ${chapterData.number} already exists, skipping...`);
        }
      }

      console.log('Chapter seeding completed successfully');
    } catch (error) {
      console.error('Error during chapter seeding:', error);
      throw error;
    }
  }
}
