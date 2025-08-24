import { DataSource } from 'typeorm';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class SeriesSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const seriesRepository = this.dataSource.getRepository(Series);

    // Check if series already exists
    const existingSeries = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!existingSeries) {
      await seriesRepository.save({
        name: 'Usogui',
        order: 1,
        description: 'In a world where gambling is life, Baku Madarame, known as "The Lie Eater," navigates the dangerous underground gambling world of Kakerou. With his supernatural ability to detect lies and his strategic mind, he faces off against the most cunning gamblers in high-stakes games where the consequences can be deadly. This psychological thriller explores themes of deception, strategy, and the price of ambition in a world where a single wrong move can cost everything.'
      });
    }
  }
}
