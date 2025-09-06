import { DataSource } from 'typeorm';
import { Event, EventType, EventStatus } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { Seeder } from './seeder.interface';

export class EventSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const eventRepository = this.dataSource.getRepository(Event);
    const characterRepository = this.dataSource.getRepository(Character);

    // Get characters for event associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame' },
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji' },
    });

    const events = [
      {
        title: "Baku's Introduction",
        description:
          'The first appearance of Baku Madarame, showing his uncanny ability to detect lies and his gambling prowess.',
        type: EventType.REVEAL,
        chapterNumber: 1,
        spoilerChapter: 1,
        status: EventStatus.APPROVED,
        characters: baku ? [baku] : [],
      },
      {
        title: 'Meeting Marco',
        description:
          'Baku encounters Marco Reiji, who becomes one of his closest allies in the gambling world.',
        type: EventType.REVEAL,
        chapterNumber: 5,
        spoilerChapter: 5,
        status: EventStatus.APPROVED,
        characters: baku && marco ? [baku, marco] : [],
      },
      {
        title: 'First Major Gamble',
        description:
          'Baku participates in his first high-stakes gamble, establishing his reputation in the underground gambling world.',
        type: EventType.GAMBLE,
        chapterNumber: 10,
        spoilerChapter: 10,
        status: EventStatus.APPROVED,
        characters: baku ? [baku] : [],
      },
      {
        title: 'Strategic Alliance Formation',
        description:
          'Key characters form an alliance that will shape the future power dynamics in the gambling world.',
        type: EventType.SHIFT,
        chapterNumber: 15,
        spoilerChapter: 15,
        status: EventStatus.APPROVED,
        characters: baku && marco ? [baku, marco] : [],
      },
      {
        title: 'Tournament Resolution',
        description:
          'The conclusion of a major tournament arc with lasting consequences for all participants.',
        type: EventType.RESOLUTION,
        chapterNumber: 25,
        spoilerChapter: 25,
        status: EventStatus.APPROVED,
        characters: baku && marco ? [baku, marco] : [],
      },
    ];

    for (const eventData of events) {
      const existingEvent = await eventRepository.findOne({
        where: { title: eventData.title },
      });

      if (!existingEvent) {
        const event = eventRepository.create(eventData);
        if (eventData.characters.length > 0) {
          event.characters = eventData.characters;
        }
        await eventRepository.save(event);
      }
    }
  }
}
