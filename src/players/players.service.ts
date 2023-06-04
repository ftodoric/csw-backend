import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { GamesService } from '@games'
import { revitalisationConversionRate } from '@games/config/game-mechanics'
import { TeamSide } from '@teams/interface'

import { CreatePlayerDto } from './dto'
import { Player } from './entities'
import { PlayerType } from './interface'
import { PlayersRepository } from './players.repository'

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository,
    @Inject(forwardRef(() => GamesService)) private gamesService: GamesService
  ) {}

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<Player> {
    return this.playersRepository.createPlayer(createPlayerDto)
  }

  async getPlayerById(id: string): Promise<Player> {
    return await this.playersRepository.getPlayerById(id)
  }

  /**
   * Each entity players has a flag that indicated whether he made an action during ths turn.
   * This is that setter.
   * @param playerId
   */
  async setPlayerMadeAction(playerId: string): Promise<void> {
    await this.playersRepository.setPlayerMadeAction(playerId)
  }

  async resetPlayerMadeAction(playerId: string): Promise<void> {
    await this.playersRepository.resetPlayerMadeAction(playerId)
  }

  async resetPlayerMadeBid(playerId: string): Promise<void> {
    await this.playersRepository.resetPlayerMadeBid(playerId)
  }

  async resetPlayerSufferedDamage(playerId: string): Promise<void> {
    await this.playersRepository.resetPlayerSufferedDamage(playerId)
  }

  async addResources(id: string, addition: number): Promise<void> {
    const player = await this.playersRepository.findOneBy({ id })
    await this.playersRepository.save({ id, resource: player.resource + addition })
  }

  async addVitality(id: string, addition: number): Promise<void> {
    const { vitality } = await this.playersRepository.findOneBy({ id })
    await this.playersRepository.save({ id, vitality: Number(vitality) + addition })
  }

  async sendResources(sourcePlayerId: string, targetPlayerId: string, amount: number) {
    const sourcePlayer = await this.playersRepository.findOneBy({ id: sourcePlayerId })
    const targetPlayer = await this.playersRepository.findOneBy({ id: targetPlayerId })
    await this.playersRepository.save({ id: sourcePlayerId, resource: sourcePlayer.resource - amount })
    await this.playersRepository.save({ id: targetPlayerId, resource: targetPlayer.resource + amount })
  }

  async revitalise(id: string, amount: number): Promise<void> {
    const player = await this.playersRepository.findOneBy({ id })

    await this.playersRepository.save({
      id,
      resource: player.resource - revitalisationConversionRate[amount],
      // Postgre decimal returns as a string
      vitality: Number(player.vitality) + amount,
    })
  }

  async reducePlayerVitality(playerId: string, attackStrength: number): Promise<Player> {
    const player = await this.playersRepository.findOneBy({ id: playerId })

    await this.playersRepository.save({
      id: playerId,
      vitality: Math.max(Number(player.vitality) - attackStrength, 0),
      hasSufferedAnyDamage: true,
    })

    return await this.playersRepository.findOneBy({ id: playerId })
  }

  async madeBid(playerId: string): Promise<void> {
    await this.playersRepository.save({
      id: playerId,
      hasMadeBid: true,
    })
  }

  async reducePlayerResource(playerId: string, amount: number): Promise<void> {
    const player = await this.playersRepository.findOneBy({ id: playerId })

    await this.playersRepository.save({
      id: playerId,
      resource: player.resource - amount,
    })
  }

  async addVictoryPoints(playerId: string, amount: number): Promise<void> {
    const player = await this.playersRepository.findOneBy({ id: playerId })

    await this.playersRepository.save({
      id: playerId,
      victoryPoints: player.victoryPoints + amount,
    })
  }

  /**
   *
   * @param gameId
   * @param side
   * @param playerType
   * @param numberOfTurns will be a negative number.
   * Negative value means to prepare a ban for next turn, in which the value will turn to its absolute value.
   * If a ban is already active, set the number of turns to its absolute value + 1 to account for this turn, too.
   * If the 'biddingBanRemainingTurns' counter is 0, then there is no active ban.
   */
  async banBidding(gameId: string, side: TeamSide, playerType: PlayerType, numberOfTurns: number): Promise<void> {
    const game = await this.gamesService.getGameById(gameId)

    const player = game[side][playerType]

    await this.playersRepository.save({
      id: player.id,
      biddingBanRemainingTurns: player.biddingBanRemainingTurns <= 0 ? numberOfTurns : Math.abs(numberOfTurns) + 1,
    })
  }

  async banAttack(gameId: string, side: TeamSide, playerType: PlayerType, numberOfTurns: number): Promise<void> {
    const game = await this.gamesService.getGameById(gameId)

    const player = game[side][playerType]

    await this.playersRepository.save({
      id: player.id,
      attackBanRemainingTurns: player.attackBanRemainingTurns <= 0 ? numberOfTurns : Math.abs(numberOfTurns) + 1,
    })
  }

  async paralyze(gameId: string, side: TeamSide, playerType: PlayerType, numberOfTurns: number): Promise<void> {
    const game = await this.gamesService.getGameById(gameId)

    const player = game[side][playerType]

    await this.playersRepository.save({
      id: player.id,
      paralysisRemainingTurns: player.paralysisRemainingTurns <= 0 ? numberOfTurns : Math.abs(numberOfTurns) + 1,
    })
  }

  async decrementConditionCounters(gameId: string, side: TeamSide): Promise<void> {
    const game = await this.gamesService.getGameById(gameId)

    const playerTypes = Object.values(PlayerType)

    // Decrement all bid ban counters
    for (let i = 0; i < playerTypes.length; i++) {
      const playerId = game[side][playerTypes[i]].id
      const biddingBanRemainingTurns = game[side][playerTypes[i]].biddingBanRemainingTurns

      let newBiddingBanRemainingTurns
      // Positive values mean that the ban is in effect
      if (biddingBanRemainingTurns > 0) {
        newBiddingBanRemainingTurns = biddingBanRemainingTurns - 1
      }
      // 0 value means there is no ban
      else if (biddingBanRemainingTurns === 0) {
        newBiddingBanRemainingTurns = 0
      }
      // Negative values means that the ban is starting next turn
      else {
        newBiddingBanRemainingTurns = Math.abs(biddingBanRemainingTurns)
      }

      await this.playersRepository.save({
        id: playerId,
        biddingBanRemainingTurns: newBiddingBanRemainingTurns,
      })
    }

    // Decrement all attack ban counters
    for (let i = 0; i < playerTypes.length; i++) {
      const playerId = game[side][playerTypes[i]].id
      const attackBanRemainingTurns = game[side][playerTypes[i]].attackBanRemainingTurns

      let newAttackBanRemainingTurns
      // Positive values mean that the ban is in effect
      if (attackBanRemainingTurns > 0) {
        newAttackBanRemainingTurns = attackBanRemainingTurns - 1
      }
      // 0 value means there is no ban
      else if (attackBanRemainingTurns === 0) {
        newAttackBanRemainingTurns = 0
      }
      // Negative values means that the ban is starting next turn
      else {
        newAttackBanRemainingTurns = Math.abs(attackBanRemainingTurns)
      }

      await this.playersRepository.save({
        id: playerId,
        attackBanRemainingTurns: newAttackBanRemainingTurns,
      })
    }

    // Decrement all paralysis counters
    for (let i = 0; i < playerTypes.length; i++) {
      const playerId = game[side][playerTypes[i]].id
      const paralysisRemainingTurns = game[side][playerTypes[i]].paralysisRemainingTurns

      let newParalysisRemainingTurns
      // Positive values mean that the ban is in effect
      if (paralysisRemainingTurns > 0) {
        newParalysisRemainingTurns = paralysisRemainingTurns - 1
      }
      // 0 value means there is no ban
      else if (paralysisRemainingTurns === 0) {
        newParalysisRemainingTurns = 0
      }
      // Negative values means that the ban is starting next turn
      else {
        newParalysisRemainingTurns = Math.abs(paralysisRemainingTurns)
      }

      await this.playersRepository.save({
        id: playerId,
        paralysisRemainingTurns: newParalysisRemainingTurns,
      })
    }

    // Decrement all armor counters
    for (let i = 0; i < playerTypes.length; i++) {
      const playerId = game[side][playerTypes[i]].id
      const armorDuration = game[side][playerTypes[i]].armorDuration
      const armor = game[side][playerTypes[i]].armor

      let newArmorDuration
      // Positive values mean that the ban is in effect
      if (armorDuration > 0) {
        newArmorDuration = armorDuration - 1
      }
      // 0 value means there is no ban
      else if (armorDuration === 0) {
        newArmorDuration = 0
      }
      // Negative values means that the ban is starting next turn
      else {
        newArmorDuration = Math.abs(armorDuration)
      }

      await this.playersRepository.save({
        id: playerId,
        armor: newArmorDuration === 0 ? 0 : armor,
        armorDuration: newArmorDuration,
      })
    }
  }

  async activateArmor(playerId: string, armor: number, duration: number): Promise<void> {
    await this.playersRepository.save({
      id: playerId,
      armor,
      armorDuration: -duration,
    })
  }
}
