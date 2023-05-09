import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AuthRepository } from '@auth'
import { User } from '@auth/entities'
import { PlayersRepository } from '@players'
import { PlayerType } from '@players/interface'
import { TeamsRepository } from '@teams'
import { TeamSide } from '@teams/interface'

import {
  TURN_TIME,
  getNextActivesOnUserAction,
  getNextTurnActives,
} from './config/game-mechanics'
import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesRepository } from './games.repository'
import { GameOutcome, GamePeriod, GameStatus } from './interface/game.types'
import { TimerGateway } from './timer.gateway'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository,
    @InjectRepository(AuthRepository) private authRepository: AuthRepository,
    @Inject(forwardRef(() => TimerGateway)) private timerGateway: TimerGateway
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
      activeSide: TeamSide.Blue,
      activePlayer: PlayerType.People,
      activePeriod: GamePeriod.January,
    })
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user)
  }

  async getGameById(id: string): Promise<Game> {
    return this.gamesRepository.getGameById(id)
  }

  async setNextActives(gameId: string, user: User) {
    const { activePlayer, activeSide, activePeriod } =
      await this.gamesRepository.findOneBy({
        id: gameId,
      })

    if (
      activePlayer === PlayerType.Intelligence &&
      activeSide === TeamSide.Red &&
      activePeriod === GamePeriod.December
    ) {
      // GAME OVER

      // Clear timer
      await this.prepareGameOver(gameId)
    } else {
      // GAME CONTINUES
      const { nextPlayer, nextSide, nextPeriod } = getNextActivesOnUserAction(
        activePlayer,
        activeSide,
        activePeriod
      )

      // Set next
      await this.gamesRepository.save({
        id: gameId,
        activePlayer: nextPlayer,
        activeSide: nextSide,
        activePeriod: nextPeriod,
      })

      // Reset timer if the last player in a team made a move
      if (activePlayer === PlayerType.Intelligence)
        await this.timerGateway.restartTimer(gameId)
    }
  }

  async prepareGameOver(gameId: string) {
    const game = await this.gamesRepository.findOneBy({ id: gameId })

    // Accumulate all victory points on each side of the team
    const blueTeamVP =
      game.blueTeam.peoplePlayer.victoryPoints +
      game.blueTeam.industryPlayer.victoryPoints +
      game.blueTeam.governmentPlayer.victoryPoints +
      game.blueTeam.energyPlayer.victoryPoints +
      game.blueTeam.intelligencePlayer.victoryPoints

    const redTeamVP =
      game.redTeam.peoplePlayer.victoryPoints +
      game.redTeam.industryPlayer.victoryPoints +
      game.redTeam.governmentPlayer.victoryPoints +
      game.redTeam.energyPlayer.victoryPoints +
      game.redTeam.intelligencePlayer.victoryPoints

    // Team with more VP wins
    if (blueTeamVP > redTeamVP) {
      await this.gamesRepository.save({
        id: game.id,
        outcome: GameOutcome.BlueWins,
      })
    } else if (redTeamVP > blueTeamVP) {
      await this.gamesRepository.save({
        id: game.id,
        outcome: GameOutcome.RedWins,
      })
    } else {
      // TIE
      await this.gamesRepository.save({
        id: game.id,
        outcome: GameOutcome.Tie,
      })
    }

    // Update the game status and remaining time
    const remainingTime = this.timerGateway.stopTimer(gameId)

    await this.gamesRepository.save({
      id: gameId,
      turnsRemainingTime: remainingTime,
      status: GameStatus.Finished,
    })
  }

  async nextTurnOnTimeout(gameId: string) {
    const game = await this.gamesRepository.getGameById(gameId)

    const { nextPlayer, nextSide, nextPeriod } = await getNextTurnActives(
      game.activeSide,
      game.activePeriod
    )

    await this.gamesRepository.save({
      id: game.id,
      // Reset time
      turnsRemainingTime: TURN_TIME,
      // Change actives
      activePlayer: nextPlayer,
      activeSide: nextSide,
      activePeriod: nextPeriod,
    })
  }

  async resetTurnsTime(gameId: string) {
    await this.gamesRepository.save({
      id: gameId,
      turnsRemainingTime: TURN_TIME,
    })
  }

  async pauseGame(gameId: string, remainingTime: number) {
    await this.gamesRepository.save({
      id: gameId,
      turnsRemainingTime: remainingTime,
      status: GameStatus.Paused,
    })
  }

  async continueGame(gameId: string) {
    this.gamesRepository.save({
      id: gameId,
      status: GameStatus.InProgress,
    })
  }
}
