import { DataSource } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Seeder } from './seeder.interface';

// Major arcs (parentId: null)
const majorArcs = [
  {
    name: 'Introduction Arc',
    order: 0,
    description:
      'Introduction to Baku Madarame and his abilities as a lie detector.',
    startChapter: 1,
    endChapter: 3,
  },
  {
    name: 'Escape the Abandoned Building Arc',
    order: 1,
    description: 'Baku enters Kakerou and faces the Abandoned Building Game.',
    startChapter: 4,
    endChapter: 34,
  },
  {
    name: 'Terrorist of the Abandoned Mine Arc',
    order: 2,
    description: 'The Hangman game in an abandoned mine.',
    startChapter: 35,
    endChapter: 79,
  },
  {
    name: 'Labyrinth Arc',
    order: 3,
    description:
      "The Labyrinth games including the 0 Yen Gamble and Minotaur's Labyrinth.",
    startChapter: 80,
    endChapter: 146,
  },
  {
    name: "The Bull's Womb Arc",
    order: 4,
    description: 'The Brazen Bull game.',
    startChapter: 147,
    endChapter: 177,
  },
  {
    name: 'KY Declaration Arc',
    order: 5,
    description: 'Events surrounding the KY Declaration TV show.',
    startChapter: 178,
    endChapter: 204,
  },
  {
    name: 'Tower of Karma Arc',
    order: 6,
    description: 'The Tower of Karma game.',
    startChapter: 205,
    endChapter: 279,
  },
  {
    name: 'Battleship Arc',
    order: 7,
    description: 'The Battleship confrontation and subsequent events.',
    startChapter: 280,
    endChapter: 328,
  },
  {
    name: 'Protoporos Arc',
    order: 8,
    description:
      'The Protoporos island arc containing multiple sub-games and tournaments.',
    startChapter: 329,
    endChapter: 428,
  },
  {
    name: 'Air Poker Arc',
    order: 9,
    description: 'The iconic Air Poker game.',
    startChapter: 429,
    endChapter: 472,
  },
  {
    name: 'Surpassing the Leader Arc',
    order: 10,
    description: 'The final arcs leading to the conclusion of the story.',
    startChapter: 473,
    endChapter: 539,
  },
];

// Sub-arcs with their parent arc name
const subArcs = [
  // Escape the Abandoned Building Arc sub-arcs
  {
    name: 'Poker Shark Arc',
    parentName: 'Escape the Abandoned Building Arc',
    order: 11,
    description: 'Sub-arc featuring a high-stakes poker game.',
    startChapter: 24,
    endChapter: 34,
  },
  // Terrorist of the Abandoned Mine Arc sub-arcs
  {
    name: "Kaji's Mother Mini-Arc",
    parentName: 'Terrorist of the Abandoned Mine Arc',
    order: 12,
    description: 'Mini-arc focusing on Kaji and his family.',
    startChapter: 70,
    endChapter: 72,
  },
  {
    name: "Ideal's Emergence Arc",
    parentName: 'Terrorist of the Abandoned Mine Arc',
    order: 13,
    description: 'Introduction of the Ideal organization.',
    startChapter: 73,
    endChapter: 79,
  },
  // Labyrinth Arc sub-arcs
  {
    name: '0 Yen Gamble Arc',
    parentName: 'Labyrinth Arc',
    order: 14,
    description: 'The 0 Yen Labyrinth Game.',
    startChapter: 80,
    endChapter: 103,
  },
  {
    name: "Minotaur's Labyrinth Arc",
    parentName: 'Labyrinth Arc',
    order: 15,
    description: 'The Labyrinth Maze Game.',
    startChapter: 104,
    endChapter: 146,
  },
  // The Bull's Womb Arc sub-arcs
  {
    name: 'Intermission Mini-Arc',
    parentName: "The Bull's Womb Arc",
    order: 16,
    description: 'Brief intermission between major arcs.',
    startChapter: 175,
    endChapter: 177,
  },
  // Tower of Karma Arc sub-arcs
  {
    name: 'The Fugitive Bee Arc',
    parentName: 'Tower of Karma Arc',
    order: 17,
    description: 'Events following the Tower of Karma.',
    startChapter: 265,
    endChapter: 279,
  },
  // Battleship Arc sub-arcs
  {
    name: 'Bookstore Arc',
    parentName: 'Battleship Arc',
    order: 18,
    description: 'Events at the bookstore.',
    startChapter: 310,
    endChapter: 323,
  },
  {
    name: 'Before the 卍 Arc',
    parentName: 'Battleship Arc',
    order: 19,
    description: 'Preparation before the BAN game.',
    startChapter: 324,
    endChapter: 328,
  },
  // Protoporos Arc sub-arcs
  {
    name: 'King of Slaves Arc',
    parentName: 'Protoporos Arc',
    order: 20,
    description: 'The King of Slaves game on Protoporos Island.',
    startChapter: 329,
    endChapter: 340,
  },
  {
    name: 'Colosseum Arc',
    parentName: 'Protoporos Arc',
    order: 21,
    description: 'The Colosseum battles.',
    startChapter: 341,
    endChapter: 350,
  },
  {
    name: 'Co-ordinators & Purgers Arc',
    parentName: 'Protoporos Arc',
    order: 22,
    description: 'Events involving the Co-ordinators and Purgers.',
    startChapter: 351,
    endChapter: 358,
  },
  {
    name: 'Azura Fortress Arc',
    parentName: 'Protoporos Arc',
    order: 23,
    description: 'The Azura Fortress events.',
    startChapter: 359,
    endChapter: 375,
  },
  {
    name: 'Dominating the Outlaws Arc',
    parentName: 'Protoporos Arc',
    order: 24,
    description: 'Dominating the Outlaws on Protoporos.',
    startChapter: 376,
    endChapter: 387,
  },
  {
    name: 'Handchopper Arc',
    parentName: 'Protoporos Arc',
    order: 25,
    description: 'The Handchopper game.',
    startChapter: 388,
    endChapter: 393,
  },
  {
    name: 'War of the Three Kingdoms Arc',
    parentName: 'Protoporos Arc',
    order: 26,
    description: 'The War of the Three Kingdoms on Protoporos.',
    startChapter: 394,
    endChapter: 403,
  },
  {
    name: 'Protoporos Nightmare Arc',
    parentName: 'Protoporos Arc',
    order: 27,
    description: 'The final events on Protoporos Island.',
    startChapter: 404,
    endChapter: 428,
  },
  // Surpassing the Leader Arc sub-arcs
  {
    name: 'Collecting the Handkerchiefs Arc',
    parentName: 'Surpassing the Leader Arc',
    order: 28,
    description: 'The Collecting the Handkerchiefs game.',
    startChapter: 473,
    endChapter: 489,
  },
  {
    name: 'Drop the Handkerchief Arc',
    parentName: 'Surpassing the Leader Arc',
    order: 29,
    description: 'The final gamble - Drop the Handkerchief.',
    startChapter: 490,
    endChapter: 531,
  },
  {
    name: 'Epilogue Arc',
    parentName: 'Surpassing the Leader Arc',
    order: 30,
    description: 'The conclusion of the Usogui story.',
    startChapter: 532,
    endChapter: 539,
  },
];

export class ArcSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const arcRepository = this.dataSource.getRepository(Arc);

    // First pass: Create major arcs
    const arcMap = new Map<string, Arc>();

    for (const arcData of majorArcs) {
      let arc = await arcRepository.findOne({
        where: { name: arcData.name },
      });

      if (!arc) {
        arc = arcRepository.create({
          name: arcData.name,
          order: arcData.order,
          description: arcData.description,
          startChapter: arcData.startChapter,
          endChapter: arcData.endChapter,
          parentId: null,
        });
        arc = await arcRepository.save(arc);
      }

      arcMap.set(arc.name, arc);
    }

    // Second pass: Create sub-arcs with parent references
    for (const subArcData of subArcs) {
      const existingArc = await arcRepository.findOne({
        where: { name: subArcData.name },
      });

      if (!existingArc) {
        const parentArc = arcMap.get(subArcData.parentName);
        if (!parentArc) {
          console.warn(`Parent arc not found: ${subArcData.parentName}`);
          continue;
        }

        const arc = arcRepository.create({
          name: subArcData.name,
          order: subArcData.order,
          description: subArcData.description,
          startChapter: subArcData.startChapter,
          endChapter: subArcData.endChapter,
          parentId: parentArc.id,
        });
        await arcRepository.save(arc);
      }
    }
  }
}
