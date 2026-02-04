import { DataSource } from 'typeorm';
import { Volume } from '../../entities/volume.entity';
import { Seeder } from './seeder.interface';

export class VolumeSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const volumeRepository = this.dataSource.getRepository(Volume);

    const initialVolumes = [
      {
        number: 1,
        title: 'The Lie Eater',
        description:
          'Introduction to Baku Madarame and the underground gambling world',
        startChapter: 1,
        endChapter: 10,
      },
      {
        number: 2,
        title: 'The First Gamble',
        description:
          'Baku faces his first serious challenge in the gambling underworld',
        startChapter: 11,
        endChapter: 20,
      },
      // Add more volumes as needed
    ];

    const existingNumbers = new Set(
      (
        await volumeRepository
          .createQueryBuilder('v')
          .select('v.number')
          .getMany()
      ).map((v) => v.number),
    );

    const newVolumes = initialVolumes.filter(
      (volume) => !existingNumbers.has(volume.number),
    );

    if (newVolumes.length === 0) {
      console.log('All volumes already exist, skipping...');
      return;
    }

    console.log(`Inserting ${newVolumes.length} new volumes...`);
    await volumeRepository.save(newVolumes);
    console.log(`Successfully inserted ${newVolumes.length} volumes`);
  }
}
