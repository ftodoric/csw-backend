import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'
import { User } from 'src/auth/user.entity'
import { UserRepository } from 'src/auth/user.repository'
import { Team } from 'src/teams/team.entity'
import { TeamsRepository } from 'src/teams/teams.repository'

import { Game } from './game.entity'
import { GamesController } from './games.controller'
import { GamesRepository } from './games.repository'
import { GamesService } from './games.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    AuthModule,
    TypeOrmModule.forFeature([Team]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [GamesService, GamesRepository, TeamsRepository, UserRepository],
  controllers: [GamesController],
})
export class GamesModule {}
