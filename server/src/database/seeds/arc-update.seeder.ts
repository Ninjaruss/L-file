import { DataSource } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class ArcUpdateSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const arcRepository = this.dataSource.getRepository(Arc);
    const chapterRepository = this.dataSource.getRepository(Chapter);
    const seriesRepository = this.dataSource.getRepository(Series);

    // Get the Usogui series
    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Skipping arc chapter updates.');
      return;
    }

    // Get chapters for arc boundaries
    const chapters = await chapterRepository.find({
      where: { series: { id: series.id } },
      order: { number: 'ASC' }
    });

    if (chapters.length === 0) {
      console.log('No chapters found. Skipping arc chapter updates.');
      return;
    }

    // Update Introduction Arc
    const introArc = await arcRepository.findOne({
      where: { name: 'Introduction Arc', series: { id: series.id } }
    });

    if (introArc) {
      const startChapterNumber = 1;
      const endChapterNumber = 3;
      
      // Verify chapters exist
      const startChapterExists = chapters.find(c => c.number === startChapterNumber);
      const endChapterExists = chapters.find(c => c.number === endChapterNumber);
      
      if (startChapterExists && endChapterExists) {
        introArc.startChapter = startChapterNumber;
        introArc.endChapter = endChapterNumber;
        await arcRepository.save(introArc);
      }
    }

    // Update Life or Death Game Arc  
    const gameArc = await arcRepository.findOne({
      where: { name: 'Life or Death Game Arc', series: { id: series.id } }
    });

    if (gameArc && chapters.length > 1) {
      const startChapterNumber = 4; // Fourth chapter
      const endChapterNumber = chapters.length > 9 ? 10 : chapters[chapters.length - 1].number;
      
      // Verify chapters exist
      const startChapterExists = chapters.find(c => c.number === startChapterNumber);
      const endChapterExists = chapters.find(c => c.number === endChapterNumber);
      
      if (startChapterExists && endChapterExists) {
        gameArc.startChapter = startChapterNumber;
        gameArc.endChapter = endChapterNumber;
        await arcRepository.save(gameArc);
      }
    }

    console.log('Arc chapter references updated successfully.');
  }
}
