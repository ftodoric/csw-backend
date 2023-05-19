import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AuthService } from '@auth'
import { User } from '@auth/entities'
import { PlayersRepository } from '@players'
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
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository,
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

    const electoratePlayer = await this.playersRepository.createPlayer(electorateUser, TeamSide.Blue, PlayerType.People)
    const ukPlcPlayer = await this.playersRepository.createPlayer(ukPlcUser, TeamSide.Blue, PlayerType.Industry)
    const ukGovernmentPlayer = await this.playersRepository.createPlayer(
      ukGovernmentUser,
      TeamSide.Blue,
      PlayerType.Government
    )
    const ukEnergyPlayer = await this.playersRepository.createPlayer(ukEnergyUser, TeamSide.Blue, PlayerType.Energy)
    const gchqPlayer = await this.playersRepository.createPlayer(gchqUser, TeamSide.Blue, PlayerType.Intelligence)

    const onlineTrollsPlayer = await this.playersRepository.createPlayer(
      onlineTrollsUser,
      TeamSide.Red,
      PlayerType.People
    )
    const energeticBearPlayer = await this.playersRepository.createPlayer(
      energeticBearUser,
      TeamSide.Red,
      PlayerType.Industry
    )
    const russianGovernmentPlayer = await this.playersRepository.createPlayer(
      russianGovernmentUser,
      TeamSide.Red,
      PlayerType.Government
    )
    const rosenergoatomPlayer = await this.playersRepository.createPlayer(
      rosenergoatomUser,
      TeamSide.Red,
      PlayerType.Energy
    )
    const scsPlayer = await this.playersRepository.createPlayer(scsUser, TeamSide.Red, PlayerType.Intelligence)

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
    await this.playersRepository.save({
      id: entityPlayer.id,
      hasMadeAction: true,
    })

    if (
      team.peoplePlayer.hasMadeAction &&
      team.industryPlayer.hasMadeAction &&
      team.governmentPlayer.hasMadeAction &&
      team.energyPlayer.hasMadeAction &&
      team.intelligencePlayer.hasMadeAction
    ) {
      console.log('%clog | description\n', 'color: #0e8dbf; margin-bottom: 5px;', 'usao')
      this.nextTurnOnTimeout(gameId)
      await this.teamsService.resetAllHasMadeActions(team.id)
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
