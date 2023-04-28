import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AuthRepository } from '@auth'
import { User } from '@auth/entities'
import { PlayersRepository } from '@players'
import { PlayerType } from '@players/interface'
import { TeamsRepository } from '@teams'
import { TeamSide } from '@teams/interface'

import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesRepository } from './games.repository'
import { GameStatus, Period } from './interface'
import { TURN_TIME } from './utils/turn-mechanics'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository,
    @InjectRepository(AuthRepository) private authRepository: AuthRepository
  ) {}

  async createGame(gameDto: CreateGameDto, user: User): Promise<string> {
    const electorateUser = await this.authRepository.findOneBy({
      id: gameDto.electoratePlayer,
    })
    const ukPlcUser = await this.authRepository.findOneBy({
      id: gameDto.ukPlcPlayer,
    })
    const ukGovernmentUser = await this.authRepository.findOneBy({
      id: gameDto.ukGovernmentPlayer,
    })
    const ukEnergyUser = await this.authRepository.findOneBy({
      id: gameDto.ukEnergyPlayer,
    })
    const gchqUser = await this.authRepository.findOneBy({
      id: gameDto.gchqPlayer,
    })

    const onlineTrollsUser = await this.authRepository.findOneBy({
      id: gameDto.onlineTrollsPlayer,
    })
    const energeticBearUser = await this.authRepository.findOneBy({
      id: gameDto.energeticBearPlayer,
    })
    const russianGovernmentUser = await this.authRepository.findOneBy({
      id: gameDto.russianGovernmentPlayer,
    })
    const rosenergoatomUser = await this.authRepository.findOneBy({
      id: gameDto.rosenergoatomPlayer,
    })
    const scsUser = await this.authRepository.findOneBy({
      id: gameDto.scsPlayer,
    })

    const electoratePlayer = await this.playersRepository.createPlayer(
      electorateUser
    )
    const ukPlcPlayer = await this.playersRepository.createPlayer(ukPlcUser)
    const ukGovernmentPlayer = await this.playersRepository.createPlayer(
      ukGovernmentUser
    )
    const ukEnergyPlayer = await this.playersRepository.createPlayer(
      ukEnergyUser
    )
    const gchqPlayer = await this.playersRepository.createPlayer(gchqUser)

    const onlineTrollsPlayer = await this.playersRepository.createPlayer(
      onlineTrollsUser
    )
    const energeticBearPlayer = await this.playersRepository.createPlayer(
      energeticBearUser
    )
    const russianGovernmentPlayer = await this.playersRepository.createPlayer(
      russianGovernmentUser
    )
    const rosenergoatomPlayer = await this.playersRepository.createPlayer(
      rosenergoatomUser
    )
    const scsPlayer = await this.playersRepository.createPlayer(scsUser)

    // Create two teams and assign players to each team entity
    const blueTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Blue,
      name: gameDto.blueTeamName,
      peoplePlayer: electoratePlayer,
      industryPlayer: ukPlcPlayer,
      governmentPlayer: ukGovernmentPlayer,
      energyPlayer: ukEnergyPlayer,
      intelligencePlayer: gchqPlayer,
    })

    const redTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Red,
      name: gameDto.redTeamName,
      peoplePlayer: onlineTrollsPlayer,
      industryPlayer: energeticBearPlayer,
      governmentPlayer: russianGovernmentPlayer,
      energyPlayer: rosenergoatomPlayer,
      intelligencePlayer: scsPlayer,
    })

    // Create a game with both sides
    return await this.gamesRepository.createGame({
      ownerId: user.id,
      blueTeam: blueTeam,
      redTeam: redTeam,
      status: GameStatus.NotStarted,
      description: gameDto.description,
      turnsRemainingTime: TURN_TIME,
      paused: true,
      activeSide: TeamSide.Blue,
      activePlayer: PlayerType.People,
      activePeriod: Period.January,
    })
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user)
  }

  async getGameById(id: string): Promise<Game> {
    return this.gamesRepository.getGameById(id)
  }
}
