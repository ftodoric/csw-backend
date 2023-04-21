import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule, AuthRepository } from '@auth'
import { User } from '@auth/entities'
import { PlayersRepository } from '@players'
import { Player } from '@players/entities'
import { TeamsRepository } from '@teams'
import { Team } from '@teams/entities'

import { Game } from './entities'
import { GamesController } from './games.controller'
import { GamesRepository } from './games.repository'
import { GamesService } from './games.service'
import { TimerGateway } from './timer.gateway'

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Player]),
    TypeOrmModule.forFeature([Team]),
    TypeOrmModule.forFeature([Game]),
  ],
  providers: [
    GamesService,
    GamesRepository,
    AuthRepository,
    PlayersRepository,
    TeamsRepository,
    TimerGateway,
  ],
  controllers: [GamesController],
})
export class GamesModule {}
