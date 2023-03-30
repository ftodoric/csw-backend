import { Module } from '@nestjs/common'
import { GamesService } from './games.service'
import { GamesController } from './games.controller'
import { GamesRepository } from './games.repository'
import { Game } from './game.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from 'src/auth/auth.module'
import { TeamsRepository } from 'src/teams/teams.repository'
import { Team } from 'src/teams/team.entity'
import { UserRepository } from 'src/auth/user.repository'
import { User } from 'src/auth/user.entity'

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
