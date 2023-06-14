import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AssetsModule } from '@assets'
import { AuthModule } from '@auth'
import { EventCardsModule } from '@event-cards'
import { PlayersModule } from '@players'
import { TeamsModule } from '@teams'

import { Game } from './entities'
import { GamesController } from './games.controller'
import { GamesRepository } from './games.repository'
import { GamesService } from './games.service'
import { WSGateway } from './ws.gateway'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesRepository, WSGateway],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Game]),
    TeamsModule,
    forwardRef(() => PlayersModule),
    AssetsModule,
    EventCardsModule,
  ],
  exports: [GamesService],
})
export class GamesModule {}
