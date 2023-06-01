import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AssetsModule } from '@assets'
import { AuthModule } from '@auth'
import { PlayersModule } from '@players'
import { TeamsModule } from '@teams'

import { Game } from './entities'
import { GamesController } from './games.controller'
import { GamesRepository } from './games.repository'
import { GamesService } from './games.service'
import { TimerGateway } from './timer.gateway'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesRepository, TimerGateway],
  imports: [AuthModule, TypeOrmModule.forFeature([Game]), TeamsModule, PlayersModule, AssetsModule],
  exports: [GamesService],
})
export class GamesModule {}
