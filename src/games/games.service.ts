import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from 'src/auth/user.entity'
import { UserRepository } from 'src/auth/user.repository'
import { TeamSide } from 'src/teams/team-side.enum'
import { TeamsRepository } from 'src/teams/teams.repository'

import { CreateGameDto } from './dto/create-game.dto'
import { GameStatus } from './game-status.enum'
import { Game } from './game.entity'
import { GamesRepository } from './games.repository'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    @InjectRepository(UserRepository) private userRepository: UserRepository
  ) {}

  async createGame(gameDto: CreateGameDto, user: User): Promise<string> {
    // Create two teams and assign players to each team entity
    const blueTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Blue,
      name: gameDto.blueTeamName,
      peoplePlayerId: gameDto.electoratePlayer,
      industryPlayerId: gameDto.ukPlcPlayer,
      governmentPlayerId: gameDto.ukGovernmentPlayer,
      energyPlayerId: gameDto.ukEnergyPlayer,
      intelligencePlayerId: gameDto.gchqPlayer,
    })

    const redTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Red,
      name: gameDto.redTeamName,
      peoplePlayerId: gameDto.onlineTrollsPlayer,
      industryPlayerId: gameDto.energeticBearPlayer,
      governmentPlayerId: gameDto.russianGovernmentPlayer,
      energyPlayerId: gameDto.rosenergoatomPlayer,
      intelligencePlayerId: gameDto.scsPlayer,
    })

    // Create a game with both sides
    return await this.gamesRepository.createGame({
      ownerId: user.id,
      blueTeam: blueTeam,
      redTeam: redTeam,
      status: GameStatus.NotStarted,
      description: gameDto.description,
    })
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user)
  }

  async getGameById(id: string): Promise<Game> {
    return this.gamesRepository.getGameById(id)
  }
}
