import { DataSource } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { Seeder } from './seeder.interface';

export class GambleSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const gambleRepository = this.dataSource.getRepository(Gamble);

    const gambles = [
      {
        name: 'Protoporos',
        rules:
          'A game involving removing stones from piles. Players take turns removing any number of stones from a single pile. The objective varies depending on the specific variant being played.',
        winCondition:
          'The player who is forced to take the last stone loses the game.',
        chapterId: 1,
      },
      {
        name: 'Poker Tournament',
        rules:
          "Standard Texas Hold'em poker with high stakes. Each player receives two hole cards and must make the best five-card hand using any combination of their hole cards and the community cards.",
        winCondition:
          'The player with the best hand at showdown wins the pot. The tournament continues until one player has all the chips.',
        chapterId: 5,
      },
      {
        name: 'Russian Roulette Variant',
        rules:
          'A deadly variant of Russian Roulette using a special mechanism. Players take turns with specific rules that determine the outcome based on psychological and strategic elements.',
        winCondition:
          'Survive all rounds while maintaining psychological advantage over opponents.',
        chapterId: 10,
      },
      {
        name: 'Card Matching Game',
        rules:
          'A complex card game involving memory, strategy, and psychological manipulation. Players must match cards while predicting opponent moves.',
        winCondition:
          'First player to achieve the target score or eliminate all opponents wins.',
        chapterId: 15,
      },
    ];

    for (const gambleData of gambles) {
      const existingGamble = await gambleRepository.findOne({
        where: { name: gambleData.name },
      });

      if (!existingGamble) {
        await gambleRepository.save(gambleData);
      }
    }
  }
}