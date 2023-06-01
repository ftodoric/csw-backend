import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import { GOVERNMENT_NEW_TURN_RESOURCE_ADDITION, INITIAL_RESOURCE, INITIAL_VITALITY } from '@games/config/game-mechanics'
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

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const { user, side, playerType } = createPlayerDto

    let initialResource = INITIAL_RESOURCE

    if (side === TeamSide.Blue && playerType === PlayerType.Government) {
      initialResource += GOVERNMENT_NEW_TURN_RESOURCE_ADDITION
    }

    const player = this.create({
      user: user,
      side,
      type: playerType,
      resource: initialResource,
      vitality: INITIAL_VITALITY,
      hasMadeAction: false,
      hasMadeBid: false,
      victoryPoints: 0,
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

  async setPlayerMadeAction(playerId: string): Promise<void> {
    try {
      await this.save({ id: playerId, hasMadeAction: true })
    } catch (error) {
      throw new NotFoundException(`Player with ID ${playerId} not found.`)
    }
  }

  async resetPlayerMadeAction(playerId): Promise<void> {
    try {
      await this.save({
        id: playerId,
        hasMadeAction: false,
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
}
