import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GamesModule } from '@games'

import { Player } from './entities'
import { PlayersController } from './players.controller'
import { PlayersRepository } from './players.repository'
import { PlayersService } from './players.service'

@Module({
  controllers: [PlayersController],
  providers: [PlayersService, PlayersRepository],
  imports: [TypeOrmModule.forFeature([Player]), forwardRef(() => GamesModule)],
  exports: [PlayersService],
})
export class PlayersModule {}
