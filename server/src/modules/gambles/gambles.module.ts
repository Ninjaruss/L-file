import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamblesController } from './gambles.controller';
import { GamblesService } from './gambles.service';
import { Gamble } from '../../entities/gamble.entity';
import { GambleTeam } from '../../entities/gamble-team.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gamble,
      GambleTeam,
      GambleRound,
      Character
    ])
  ],
  controllers: [GamblesController],
  providers: [GamblesService],
  exports: [GamblesService]
})
export class GamblesModule {}
