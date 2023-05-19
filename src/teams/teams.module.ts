import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PlayersModule } from '@players'

import { Team } from './entities'
import { TeamsController } from './teams.controller'
import { TeamsRepository } from './teams.repository'
import { TeamsService } from './teams.service'

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository],
  imports: [TypeOrmModule.forFeature([Team]), PlayersModule],
  exports: [TeamsService, TeamsRepository],
})
export class TeamsModule {}
