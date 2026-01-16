import { DataSource } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { Seeder } from './seeder.interface';

// Gambles data from Usogui wiki with correct chapter numbers
const gambles = [
  {
    name: 'Escape the Abandoned Building',
    description: "Baku's first Kakerou gamble in an abandoned building.",
    rules: 'A survival game where participants must escape a dangerous abandoned building while facing various traps and psychological challenges.',
    winCondition: 'Successfully escape the building while outmaneuvering opponents.',
    chapterId: 6,
  },
  {
    name: 'Poker Shark',
    description: 'A high-stakes Seven-card Stud poker game.',
    rules: 'Standard Seven-card Stud poker with Kakerou stakes. Players must read opponents and manage their chips strategically.',
    winCondition: 'Win the poker game by having the best hand or forcing opponents to fold.',
    chapterId: 24,
  },
  {
    name: 'Hangman Game',
    description: 'The deadly Hangman game in the abandoned mine.',
    rules: 'A twisted version of Hangman where wrong guesses have severe consequences. Players must deduce the hidden word while managing risk.',
    winCondition: 'Guess the word/phrase correctly before running out of chances.',
    chapterId: 41,
  },
  {
    name: '0 Yen Labyrinth Game',
    description: 'A game involving navigation with zero resources.',
    rules: 'Navigate a complex situation starting with absolutely nothing. Players must use wit and strategy to acquire resources.',
    winCondition: 'Complete the objective despite starting with nothing.',
    chapterId: 80,
  },
  {
    name: "Minotaur's Labyrinth",
    description: 'The Labyrinth Maze Game.',
    rules: 'Navigate through a complex maze with various challenges and opponents lurking within.',
    winCondition: 'Reach the exit of the labyrinth while overcoming all obstacles.',
    chapterId: 104,
  },
  {
    name: "The Bull's Womb",
    description: 'A deadly game involving the Brazen Bull torture device.',
    rules: 'A psychological and physical endurance game involving extreme heat and pressure.',
    winCondition: 'Survive the ordeal while outmaneuvering opponents.',
    chapterId: 147,
  },
  {
    name: 'Tower of Karma',
    description: 'A multi-stage tower climbing game.',
    rules: 'Ascend through the tower while completing challenges at each level. Each floor presents unique dangers and puzzles.',
    winCondition: 'Reach the top of the tower.',
    chapterId: 205,
  },
  {
    name: 'Battleship',
    description: 'A strategic naval confrontation game.',
    rules: 'A deadly version of the classic Battleship game with real stakes and consequences.',
    winCondition: 'Sink all opponent ships or achieve strategic victory.',
    chapterId: 280,
  },
  {
    name: '卍 (BAN)',
    description: 'The BAN game featuring the 卍 symbol.',
    rules: 'A complex game involving the 卍 (manji) pattern with strategic and psychological elements.',
    winCondition: 'Complete the BAN challenge.',
    chapterId: 324,
  },
  {
    name: 'Protoporos',
    description: 'The main game on Protoporos Island containing multiple sub-games.',
    rules: 'A comprehensive tournament system on Protoporos Island involving various games and faction conflicts.',
    winCondition: 'Survive and dominate the island tournament.',
    chapterId: 329,
  },
  {
    name: 'Air Poker',
    description: 'The iconic Air Poker game.',
    rules: 'A unique poker variant where cards are played "in the air" using memory and psychological deception. Players must remember all cards played.',
    winCondition: 'Win the poker game using air-based betting mechanics and superior memory.',
    chapterId: 429,
  },
  {
    name: 'Collecting the Handkerchiefs',
    description: 'A game involving collecting handkerchiefs.',
    rules: 'Players must collect the required number of handkerchiefs through various means.',
    winCondition: 'Collect all required handkerchiefs before opponents.',
    chapterId: 473,
  },
  {
    name: 'Drop the Handkerchief',
    description: 'The final gamble of the series.',
    rules: 'A deadly adaptation of the children\'s game "Drop the Handkerchief" with life-or-death stakes.',
    winCondition: 'Win the Drop the Handkerchief game.',
    chapterId: 490,
  },
];

export class GambleSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const gambleRepository = this.dataSource.getRepository(Gamble);

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
