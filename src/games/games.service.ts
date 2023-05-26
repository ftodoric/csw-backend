import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AuthService } from '@auth'
import { User } from '@auth/entities'
import { PlayersService } from '@players'
import { Player } from '@players/entities'
import { PlayerType } from '@players/interface'
import { TeamsService } from '@teams'
import { TeamSide } from '@teams/interface'

import { GOVERNMENT_NEW_TURN_RESOURCE_ADDITION, TURN_TIME, getNextTurnActives } from './config/game-mechanics'
import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesRepository } from './games.repository'
import { GameOutcome, GamePeriod, GameStatus } from './interface/game.types'
import { TimerGateway } from './timer.gateway'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    private authService: AuthService,
    private teamsService: TeamsService,
    private playersService: PlayersService,
    @Inject(forwardRef(() => TimerGateway)) private timerGateway: TimerGateway
  ) {}

  /**
   * This method creates players for each entitity, two teams with their respective player
   * and finally a game with the two created teams.
   * @param gameDto
   * @param user
   * @returns
   */
  async createGame(gameDto: CreateGameDto, user: User): Promise<string> {
    // Find all users
    const electorateUser = await this.authService.getUserById(gameDto.electorateUserId)
    const ukPlcUser = await this.authService.getUserById(gameDto.ukPlcUserId)
    const ukGovernmentUser = await this.authService.getUserById(gameDto.ukGovernmentUserId)
    const ukEnergyUser = await this.authService.getUserById(gameDto.ukEnergyUserId)
    const gchqUser = await this.authService.getUserById(gameDto.gchqUserId)

    const onlineTrollsUser = await this.authService.getUserById(gameDto.onlineTrollsUserId)
    const energeticBearUser = await this.authService.getUserById(gameDto.energeticBearUserId)
    const russianGovernmentUser = await this.authService.getUserById(gameDto.russianGovernmentUserId)
    const rosenergoatomUser = await this.authService.getUserById(gameDto.rosenergoatomUserId)
    const scsUser = await this.authService.getUserById(gameDto.scsUserId)

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
    const blueTeam = await this.teamsService.createTeam({
      side: TeamSide.Blue,
      name: gameDto.blueTeamName,
      peoplePlayer: electoratePlayer,
      industryPlayer: ukPlcPlayer,
      governmentPlayer: ukGovernmentPlayer,
      energyPlayer: ukEnergyPlayer,
      intelligencePlayer: gchqPlayer,
    })

    const redTeam = await this.teamsService.createTeam({
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
      activePeriod: GamePeriod.January,
    })
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user)
  }

  async getGameById(id: string): Promise<Game> {
    return await this.gamesRepository.getGameById(id)
  }

  async nextTurn(gameId: string) {
    const game = await this.gamesRepository.getGameById(gameId)

    // Reset made actions counter to active team
    let team
    if (game.activeSide === TeamSide.Blue) {
      team = await this.teamsService.getTeamById(game.blueTeam.id)
    } else {
      team = await this.teamsService.getTeamById(game.redTeam.id)
    }
    await this.teamsService.resetTeamActions(team.id)

    // Check if game ended
    if (game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Red) {
      await this.setGameOver(gameId)

      await this.timerGateway.stopTimer(gameId)
    } else {
      const { nextSide, nextPeriod } = await getNextTurnActives(game.activeSide, game.activePeriod)

      await this.gamesRepository.save({
        id: game.id,
        // Reset and checkpoint the time
        turnsRemainingTime: TURN_TIME,
        // Change actives
        activeSide: nextSide,
        activePeriod: nextPeriod,
      })

      await this.playersService.addResources(game[nextSide].governmentPlayer.id, GOVERNMENT_NEW_TURN_RESOURCE_ADDITION)

      await this.timerGateway.handleRestartTimer(game.id)
    }
  }

  async setNextTurnIfLastTeamAction(gameId: string, entityPlayer: Player) {
    // Flag the player that made an action
    await this.playersService.setPlayerMadeAction(entityPlayer.id)

    // Find active team
    const game = await this.gamesRepository.getGameById(gameId)
    let team
    if (game.activeSide === TeamSide.Blue) {
      team = await this.teamsService.getTeamById(game.blueTeam.id)
    } else {
      team = await this.teamsService.getTeamById(game.redTeam.id)
    }

    if (
      team.peoplePlayer.hasMadeAction &&
      team.industryPlayer.hasMadeAction &&
      team.governmentPlayer.hasMadeAction &&
      team.energyPlayer.hasMadeAction &&
      team.intelligencePlayer.hasMadeAction
    ) {
      await this.nextTurn(gameId)
    }
  }

  async setGameOver(gameId: string) {
    const game = await this.getGameById(gameId)

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
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.BlueVictory)
    } else if (redTeamVP > blueTeamVP) {
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.RedVictory)
    } else {
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.Tie)
    }

    await this.gamesRepository.setGameStatus(game.id, GameStatus.Finished)
  }

  async pauseGame(gameId: string, remainingTime: number) {
    this.gamesRepository.pauseGame(gameId, remainingTime)
  }

  continueGame(gameId: string): Promise<void> {
    return this.gamesRepository.setGameStatus(gameId, GameStatus.InProgress)
  }

  async sendResource(sourcePlayerId: string, targetPlayerId: string, resourceAmount: number): Promise<void> {
    await this.playersService.sendResources(sourcePlayerId, targetPlayerId, resourceAmount)
  }

  async revitalise(playerId: string, revitalizationAmount: number): Promise<void> {
    await this.playersService.revitalise(playerId, revitalizationAmount)
  }
}
