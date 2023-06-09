import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import { GOVERNMENT_NEW_TURN_RESOURCE_ADDITION, INITIAL_RESOURCE, INITIAL_VITALITY } from '@games/config/game-mechanics'
import { GameAction } from '@games/interface/game.types'
import { TeamSide } from '@teams/interface'
import { DataSource, Repository } from 'typeorm'

import { CreatePlayerDto } from './dto'
import { Player } from './entities'
import { PlayerType } from './interface'

@Injectable()
export class PlayersRepository extends Repository<Player> {
  constructor(dataSource: DataSource) {
    super(Player, dataSource.createEntityManager())
  }

  async createPlayer(createPlayerDto: CreatePlayerDto, isPeoplesRevoltCardDrawn?: boolean): Promise<Player> {
    const { user, side, playerType } = createPlayerDto

    let initialResource = INITIAL_RESOURCE

    if (side === TeamSide.Red && playerType === PlayerType.Government && !isPeoplesRevoltCardDrawn) {
      initialResource += GOVERNMENT_NEW_TURN_RESOURCE_ADDITION
    }

    const player = this.create({
      user: user,
      side,
      type: playerType,
      resource: initialResource,
      vitality: INITIAL_VITALITY,
      victoryPoints: 0,
      madeAction: null,
      biddingBanRemainingTurns: 0,
      hasMadeBid: false,
      attackBanRemainingTurns: 0,
      paralysisRemainingTurns: 0,
      armor: 0,
      armorDuration: 0,
      hasSufferedAnyDamage: false,
      damageImmunityDuration: 0,
      isSplashImmune: false,
      hasDoubleDamage: false,
      hasCyberInvestmentProgramme: false,
      hasRansomwareAttack: false,
      wasRansomwareAttacked: false,
    })

    try {
      await this.save(player)
    } catch (error) {
      // Duplicate player
      if (error.code === '23505') throw new ConflictException('A player with that ID already exists.')
      else throw new InternalServerErrorException()
    }

    return player
  }

  async getPlayerById(id: string): Promise<Player> {
    const player = await this.findOneBy({ id })

    if (!player) throw new NotFoundException(`Player with ID ${id} not found.`)

    return player
  }

  async setPlayerAction(playerId: string, actionType: GameAction): Promise<void> {
    try {
      await this.save({ id: playerId, madeAction: actionType })
    } catch (error) {
      throw new NotFoundException(`Player with ID ${playerId} not found.`)
    }
  }

  async resetPlayerMadeAction(playerId): Promise<void> {
    try {
      await this.save({
        id: playerId,
        madeAction: null,
      })
    } catch (error) {
      throw new NotFoundException(`Player with ID ${playerId} not found.`)
    }
  }

  async resetPlayerMadeBid(playerId): Promise<void> {
    try {
      await this.save({
        id: playerId,
        hasMadeBid: false,
      })
    } catch (error) {
      throw new NotFoundException(`Player with ID ${playerId} not found.`)
    }
  }

  async resetPlayerSufferedDamage(playerId): Promise<void> {
    try {
      await this.save({
        id: playerId,
        hasSufferedAnyDamage: false,
      })
    } catch (error) {
      throw new NotFoundException(`Player with ID ${playerId} not found.`)
    }
  }
}
