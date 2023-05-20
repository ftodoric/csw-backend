import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AuthService } from '@auth'
import { User } from '@auth/entities'
import { PlayersService } from '@players'
import { Player } from '@players/entities'
import { PlayerType } from '@players/interface'
import { TeamsRepository, TeamsService } from '@teams'
import { TeamSide } from '@teams/interface'

import { TURN_TIME, getNextTurnActives } from './config/game-mechanics'
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
    private playersService: PlayersService,
    private authService: AuthService,
    @Inject(TeamsService) private teamsService: TeamsService,
    @Inject(forwardRef(() => TimerGateway)) private timerGateway: TimerGateway
  ) {}

  async createGame(gameDto: CreateGameDto, user: User): Promise<string> {
    const electorateUser = await this.authService.getUserById(gameDto.electoratePlayer)
    const ukPlcUser = await this.authService.getUserById(gameDto.ukPlcPlayer)
    const ukGovernmentUser = await this.authService.getUserById(gameDto.ukGovernmentPlayer)
    const ukEnergyUser = await this.authService.getUserById(gameDto.ukEnergyPlayer)
    const gchqUser = await this.authService.getUserById(gameDto.gchqPlayer)

    const onlineTrollsUser = await this.authService.getUserById(gameDto.onlineTrollsPlayer)
    const energeticBearUser = await this.authService.getUserById(gameDto.energeticBearPlayer)
    const russianGovernmentUser = await this.authService.getUserById(gameDto.russianGovernmentPlayer)
    const rosenergoatomUser = await this.authService.getUserById(gameDto.rosenergoatomPlayer)
    const scsUser = await this.authService.getUserById(gameDto.scsPlayer)

    // Create blue team players
    const electoratePlayer = await this.playersService.createPlayer({
      user: electorateUser,
      side: TeamSide.Blue,
      playerType: PlayerType.People,
    })
    const ukPlcPlayer = await this.playersService.createPlayer({
      user: ukPlcUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Industry,
    })
    const ukGovernmentPlayer = await this.playersService.createPlayer({
      user: ukGovernmentUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Government,
    })
    const ukEnergyPlayer = await this.playersService.createPlayer({
      user: ukEnergyUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Energy,
    })
    const gchqPlayer = await this.playersService.createPlayer({
      user: gchqUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Intelligence,
    })

    // Create red team players
    const onlineTrollsPlayer = await this.playersService.createPlayer({
      user: onlineTrollsUser,
      side: TeamSide.Red,
      playerType: PlayerType.People,
    })
    const energeticBearPlayer = await this.playersService.createPlayer({
      user: energeticBearUser,
      side: TeamSide.Red,
      playerType: PlayerType.Industry,
    })
    const russianGovernmentPlayer = await this.playersService.createPlayer({
      user: russianGovernmentUser,
      side: TeamSide.Red,
      playerType: PlayerType.Government,
    })
    const rosenergoatomPlayer = await this.playersService.createPlayer({
      user: rosenergoatomUser,
      side: TeamSide.Red,
      playerType: PlayerType.Energy,
    })
    const scsPlayer = await this.playersService.createPlayer({
      user: scsUser,
      side: TeamSide.Red,
      playerType: PlayerType.Intelligence,
    })

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

  async setNextTurnIfLastTeamAction(gameId: string, entityPlayer: Player) {
    const game = await this.getGameById(gameId)

    // Find active team
    let team
    if (game.activeSide === TeamSide.Blue) {
      team = await this.teamsRepository.findOneBy({ id: game.blueTeam.id })
    } else {
      team = await this.teamsRepository.findOneBy({ id: game.redTeam.id })
    }

    // Find player that made an action
    this.playersService.setPlayerMadeAction(entityPlayer.id)

    if (
      team.peoplePlayer.hasMadeAction &&
      team.industryPlayer.hasMadeAction &&
      team.governmentPlayer.hasMadeAction &&
      team.energyPlayer.hasMadeAction &&
      team.intelligencePlayer.hasMadeAction
    ) {
      console.log('%clog | description\n', 'color: #0e8dbf; margin-bottom: 5px;', 'usao')
      this.nextTurnOnTimeout(gameId)
      await this.teamsService.resetTeamActions(team.id)
    }
  }

  async setGameOver(gameId: string, remainingTime: number) {
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

    await this.gamesRepository.save({
      id: gameId,
      turnsRemainingTime: remainingTime,
      status: GameStatus.Finished,
    })
  }

  async nextTurnOnTimeout(gameId: string) {
    const game = await this.gamesRepository.getGameById(gameId)

    const { nextSide, nextPeriod } = await getNextTurnActives(game.activeSide, game.activePeriod)

    await this.gamesRepository.save({
      id: game.id,
      // Reset time
      turnsRemainingTime: TURN_TIME,
      // Change actives
      activeSide: nextSide,
      activePeriod: nextPeriod,
    })

    await this.timerGateway.restartTimer(game.id)
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
