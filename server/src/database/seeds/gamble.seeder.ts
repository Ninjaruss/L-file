import { DataSource } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleTeam } from '../../entities/gamble-team.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class GambleSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const gambleRepository = this.dataSource.getRepository(Gamble);
    const teamRepository = this.dataSource.getRepository(GambleTeam);
    const roundRepository = this.dataSource.getRepository(GambleRound);
    const characterRepository = this.dataSource.getRepository(Character);
    const seriesRepository = this.dataSource.getRepository(Series);

    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    // Get characters for gamble associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame', series: { id: series.id } }
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji', series: { id: series.id } }
    });

    // Create gambles
    const gambles = [
      {
        name: 'Protoporos',
        rules: 'A game involving removing stones from piles. Players take turns removing any number of stones from a single pile. The objective varies depending on the specific variant being played.',
        winCondition: 'The player who is forced to take the last stone loses the game.',
        chapterId: 1,
        observers: baku && marco ? [baku, marco] : []
      },
      {
        name: 'Poker Tournament',
        rules: 'Standard Texas Hold\'em poker with high stakes. Each player receives two hole cards and must make the best five-card hand using any combination of their hole cards and the community cards.',
        winCondition: 'The player with the best hand at showdown wins the pot. The tournament continues until one player has all the chips.',
        chapterId: 5,
        observers: []
      },
      {
        name: 'Russian Roulette Variant',
        rules: 'A deadly variant of Russian Roulette using a special mechanism. Players take turns with specific rules that determine the outcome based on psychological and strategic elements.',
        winCondition: 'Survive all rounds while maintaining psychological advantage over opponents.',
        chapterId: 10,
        observers: marco ? [marco] : []
      },
      {
        name: 'Card Matching Game',
        rules: 'A complex card game involving memory, strategy, and psychological manipulation. Players must match cards while predicting opponent moves.',
        winCondition: 'First player to achieve the target score or eliminate all opponents wins.',
        chapterId: 15,
        observers: []
      }
    ];

    for (const gambleData of gambles) {
      let existingGamble = await gambleRepository.findOne({
        where: { name: gambleData.name }
      });

      if (!existingGamble) {
        existingGamble = await gambleRepository.save(gambleData);

        // Create teams for this gamble
        const teams = [
          {
            name: `${gambleData.name} Team A`,
            gamble: existingGamble,
            members: baku ? [baku] : [],
            stake: 'High stakes bet - Winner takes all'
          },
          {
            name: `${gambleData.name} Team B`,
            gamble: existingGamble,
            members: marco ? [marco] : [],
            stake: 'Reputation and territorial rights'
          }
        ];

        const savedTeams: GambleTeam[] = [];
        for (const teamData of teams) {
          const savedTeam = await teamRepository.save(teamData);
          savedTeams.push(savedTeam);
        }

        // Create rounds for this gamble
        const rounds = [
          {
            roundNumber: 1,
            gamble: existingGamble,
            winner: savedTeams[0],
            outcome: `Team A wins the first round of ${gambleData.name} through strategic play`,
            reward: 'Advancement to next round',
            penalty: 'None'
          },
          {
            roundNumber: 2,
            gamble: existingGamble,
            winner: savedTeams[1],
            outcome: `Team B makes a comeback in round 2 using psychological tactics`,
            reward: 'Equalizes the score',
            penalty: 'Team A loses momentum'
          },
          {
            roundNumber: 3,
            gamble: existingGamble,
            winner: savedTeams[0],
            outcome: `Final round won by Team A with a brilliant strategic move`,
            reward: 'Victory and all stakes',
            penalty: 'Team B forfeits their stake'
          }
        ];

        for (const roundData of rounds) {
          await roundRepository.save(roundData);
        }
      }
    }
  }
}
