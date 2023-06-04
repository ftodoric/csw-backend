import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import { User } from '@auth/entities'
import { DataSource, Repository } from 'typeorm'

import { GameDto } from './dto'
import { Game } from './entities'
import { GameOutcome, GameStatus } from './interface/game.types'

@Injectable()
export class GamesRepository extends Repository<Game> {
  constructor(dataSource: DataSource) {
    super(Game, dataSource.createEntityManager())
  }

  async createGame(gameDto: GameDto): Promise<string> {
    const game = this.create(gameDto)

    let gameWithId
    try {
      gameWithId = await this.save({
        ...game,
        isRussianGovernmentAttacked: false,
        isUkEnergyAttacked: false,
        isRosenergoatomAttacked: false,
        didGCHQRevitaliseThisQuarter: false,
        recruitmentDriveCurrentQuartersStreak: 0,
        recruitmentDriveMaxQuartersStreak: 0,
        energeticBearAprilVitality: 0,
        energeticBearAugustVitality: 0,
        didRosenergoatomRevitaliseThisQuarter: false,
        growCapacityCurrentQuartersStreak: 0,
        growCapacityMaxQuartersStreak: 0,
        isRecoveryManagementActive: false,
      })
    } catch (error) {
      // Duplicate game
      if (error.code === '23505') throw new ConflictException('A game with that ID already exists.')
      else throw new InternalServerErrorException()
    }

    return gameWithId.id
  }

  /**
   * This method only selects important info for the frontend.
   * For all the details about a single game, frontend fetches a single game.
   * @param user
   * @returns
   */
  async getGames(user: User): Promise<Game[]> {
    const query = this.createQueryBuilder('game')

      // SELECT
      .select('game.id')
      .addSelect('game.ownerId')
      .addSelect('game.status')
      .addSelect('game.outcome')
      .addSelect('game.description')
      .addSelect('blueTeam.name')
      .addSelect('redTeam.name')

      // JOINS
      .innerJoin('game.blueTeam', 'blueTeam')
      .innerJoin('game.redTeam', 'redTeam')

      // Join blue team players
      .innerJoin('blueTeam.peoplePlayer', 'electoratePlayer')
      .innerJoin('blueTeam.industryPlayer', 'ukPlcPlayer')
      .innerJoin('blueTeam.governmentPlayer', 'ukGovernmentPlayer')
      .innerJoin('blueTeam.energyPlayer', 'ukEnergyPlayer')
      .innerJoin('blueTeam.intelligencePlayer', 'gchqPlayer')

      // Join red team players
      .innerJoin('redTeam.peoplePlayer', 'onlineTrollsPlayer')
      .innerJoin('redTeam.industryPlayer', 'energeticBearPlayer')
      .innerJoin('redTeam.governmentPlayer', 'russianGovernmentPlayer')
      .innerJoin('redTeam.energyPlayer', 'rosenergoatomPlayer')
      .innerJoin('redTeam.intelligencePlayer', 'scsPlayer')

      // Join blue players users
      .innerJoin('electoratePlayer.user', 'electorateUser')
      .innerJoin('ukPlcPlayer.user', 'ukPlcUser')
      .innerJoin('ukGovernmentPlayer.user', 'ukGovernmentUser')
      .innerJoin('ukEnergyPlayer.user', 'ukEnergyUser')
      .innerJoin('gchqPlayer.user', 'gchqUser')

      // Join red players users
      .innerJoin('onlineTrollsPlayer.user', 'onlineTrollsUser')
      .innerJoin('energeticBearPlayer.user', 'energeticBearUser')
      .innerJoin('russianGovernmentPlayer.user', 'russianGovernmentUser')
      .innerJoin('rosenergoatomPlayer.user', 'rosenergoatomUser')
      .innerJoin('scsPlayer.user', 'scsUser')

      // WHERES
      // Only games in which the user participates are eligible
      .where('electorateUser.id = :id', { id: user.id })
      .orWhere('ukPlcUser.id = :id', { id: user.id })
      .orWhere('ukGovernmentUser.id = :id', { id: user.id })
      .orWhere('ukEnergyUser.id = :id', { id: user.id })
      .orWhere('gchqUser.id = :id', { id: user.id })
      .orWhere('onlineTrollsUser.id = :id', { id: user.id })
      .orWhere('energeticBearUser.id = :id', { id: user.id })
      .orWhere('russianGovernmentPlayer.id = :id', { id: user.id })
      .orWhere('rosenergoatomUser.id = :id', { id: user.id })
      .orWhere('scsUser.id = :id', { id: user.id })
    return query.getMany()
  }

  async getGameById(id: string): Promise<Game> {
    const game = await this.findOneBy({ id })

    if (!game) throw new NotFoundException(`Game with ID ${id} not found.`)

    return game
  }

  async setGameStatus(gameId: string, status: GameStatus): Promise<void> {
    try {
      this.save({
        id: gameId,
        status,
      })
    } catch (error) {
      throw new NotFoundException(`Game with ID ${gameId} does not exist.`)
    }
  }

  async setGameOutcome(gameId: string, outcome: GameOutcome): Promise<void> {
    try {
      await this.save({
        id: gameId,
        outcome,
      })
    } catch (error) {
      throw new NotFoundException(`Game with ID ${gameId} does not exist.`)
    }
  }

  async pauseGame(gameId: string, remainingTime: number) {
    try {
      await this.save({
        id: gameId,
        turnsRemainingTime: remainingTime,
        status: GameStatus.Paused,
      })
    } catch (error) {
      throw new NotFoundException(`Game with ID ${gameId} doesn not exist.`)
    }
  }

  async adjustQuarterlyRecruitmentDriveStreak(gameId: string): Promise<void> {
    const { didGCHQRevitaliseThisQuarter, recruitmentDriveCurrentQuartersStreak, recruitmentDriveMaxQuartersStreak } =
      await this.getGameById(gameId)

    const newRecruitmentDriveCurrentQuartersStreak = didGCHQRevitaliseThisQuarter
      ? recruitmentDriveCurrentQuartersStreak + 1
      : 0

    await this.save({
      id: gameId,
      didGCHQRevitaliseThisQuarter: false,
      recruitmentDriveCurrentQuartersStreak: newRecruitmentDriveCurrentQuartersStreak,
      recruitmentDriveMaxQuartersStreak:
        newRecruitmentDriveCurrentQuartersStreak > recruitmentDriveMaxQuartersStreak
          ? newRecruitmentDriveCurrentQuartersStreak
          : recruitmentDriveMaxQuartersStreak,
    })
  }

  async adjustQuarterlyGrowCapacityStreak(gameId: string): Promise<void> {
    const { didRosenergoatomRevitaliseThisQuarter, growCapacityCurrentQuartersStreak, growCapacityMaxQuartersStreak } =
      await this.getGameById(gameId)

    const newGrowCapacityCurrentQuartersStreak = didRosenergoatomRevitaliseThisQuarter
      ? growCapacityCurrentQuartersStreak + 1
      : 0

    await this.save({
      id: gameId,
      didRosenergoatomRevitaliseThisQuarter: false,
      growCapacityCurrentQuartersStreak: newGrowCapacityCurrentQuartersStreak,
      growCapacityMaxQuartersStreak:
        newGrowCapacityCurrentQuartersStreak > growCapacityMaxQuartersStreak
          ? newGrowCapacityCurrentQuartersStreak
          : growCapacityMaxQuartersStreak,
    })
  }

  async setEnergeticBearAprilVitality(gameId: string, vitality: number): Promise<void> {
    await this.save({ id: gameId, energeticBearAprilVitality: vitality })
  }

  async setEnergeticBearAugustVitality(gameId: string, vitality: number): Promise<void> {
    await this.save({ id: gameId, energeticBearAugustVitality: vitality })
  }
}
