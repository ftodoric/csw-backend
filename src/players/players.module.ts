import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Player } from './entities'
import { PlayersController } from './players.controller'
import { PlayersRepository } from './players.repository'
import { PlayersService } from './players.service'

@Module({
  controllers: [PlayersController],
  providers: [PlayersService, PlayersRepository],
  imports: [TypeOrmModule.forFeature([Player])],
  exports: [PlayersService],
})
export class PlayersModule {}
