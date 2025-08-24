import { DataSource } from 'typeorm';
import { Volume } from '../../entities/volume.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class VolumeSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const volumeRepository = this.dataSource.getRepository(Volume);
    const seriesRepository = this.dataSource.getRepository(Series);

    // Get the Usogui series
    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    const initialVolumes = [
      {
        number: 1,
        title: 'The Lie Eater',
        description: 'Introduction to Baku Madarame and the underground gambling world',
        startChapter: 1,
        endChapter: 10,
        series: { id: series.id } as Series
      },
      {
        number: 2,
        title: 'The First Gamble',
        description: 'Baku faces his first serious challenge in the gambling underworld',
        startChapter: 11,
        endChapter: 20,
        series: { id: series.id } as Series
      },
      // Add more volumes as needed
    ];

    // Create volumes
    for (const volumeData of initialVolumes) {
      const existingVolume = await volumeRepository.findOne({
        where: { 
          number: volumeData.number,
          series: { id: series.id }
        }
      });

      if (!existingVolume) {
        const volume = volumeRepository.create({
          number: volumeData.number,
          description: volumeData.description,
          startChapter: volumeData.startChapter,
          endChapter: volumeData.endChapter,
          series: volumeData.series
        });
        await volumeRepository.save(volume);
        console.log(`Created volume ${volumeData.number}: ${volumeData.title}`);
      } else {
        console.log(`Volume ${volumeData.number} already exists, skipping...`);
      }
    }

    console.log('Volume seeding completed successfully');
  }
}
