import { DataSource } from 'typeorm';
import { Event, EventType } from '../../entities/event.entity';
import { Series } from '../../entities/series.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Seeder } from './seeder.interface';

export class EventSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const eventRepository = this.dataSource.getRepository(Event);
    const seriesRepository = this.dataSource.getRepository(Series);
    const characterRepository = this.dataSource.getRepository(Character);

    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    // Get characters for event associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame', series: { id: series.id } }
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji', series: { id: series.id } }
    });

    const events = [
      {
        title: 'Baku\'s Introduction',
        description: 'The first appearance of Baku Madarame, showing his uncanny ability to detect lies and his gambling prowess.',
        type: EventType.CHARACTER_REVEAL,
        startChapter: 1,
        endChapter: 1,
        spoilerChapter: 1,
        pageNumbers: [1, 2, 3],
        isVerified: true,
        chapterReferences: [
          { chapterNumber: 1, context: "First appearance - Introduction to the lie eater" }
        ],
        series: series,
        characters: baku ? [baku] : []
      },
      {
        title: 'Meeting Marco',
        description: 'Baku encounters Marco Reiji, who becomes one of his closest allies in the gambling world.',
        type: EventType.CHARACTER_REVEAL,
        startChapter: 5,
        endChapter: 5,
        spoilerChapter: 5,
        pageNumbers: [12, 15, 18],
        isVerified: true,
        chapterReferences: [
          { chapterNumber: 5, context: "Marco's introduction and first meeting with Baku" }
        ],
        series: series,
        characters: baku && marco ? [baku, marco] : []
      },
      {
        title: 'Kakerou Introduction',
        description: 'The mysterious organization Kakerou is introduced, revealing the underground world of high-stakes gambling.',
        type: EventType.PLOT,
        startChapter: 1,
        endChapter: 3,
        spoilerChapter: 1,
        pageNumbers: [20, 25, 30],
        isVerified: true,
        chapterReferences: [
          { chapterNumber: 1, context: "First mention of Kakerou" },
          { chapterNumber: 3, context: "Detailed explanation of the organization" }
        ],
        series: series,
        characters: []
      },
      {
        title: 'First Major Gamble',
        description: 'Baku participates in his first major gambling event, establishing his reputation in the underground scene.',
        type: EventType.ARC,
        startChapter: 1,
        endChapter: 10,
        spoilerChapter: 1,
        pageNumbers: [5, 8, 12, 20],
        isVerified: true,
        chapterReferences: [
          { chapterNumber: 1, context: "Introduction to the gambling event" },
          { chapterNumber: 10, context: "Conclusion of the first major gamble" }
        ],
        series: series,
        characters: baku ? [baku] : []
      },
      {
        title: 'The Lie Detection Ability',
        description: 'Baku\'s supernatural ability to detect lies is first demonstrated, showcasing what makes him unique.',
        type: EventType.CHARACTER_REVEAL,
        startChapter: 1,
        endChapter: 1,
        spoilerChapter: 1,
        pageNumbers: [8, 10],
        isVerified: true,
        chapterReferences: [
          { chapterNumber: 1, context: "First demonstration of Baku's lie detection ability" }
        ],
        series: series,
        characters: baku ? [baku] : []
      }
    ];

    for (const eventData of events) {
      const existingEvent = await eventRepository.findOne({
        where: { 
          title: eventData.title,
          series: { id: series.id }
        }
      });

      if (!existingEvent) {
        await eventRepository.save(eventData);
      }
    }
  }
}
