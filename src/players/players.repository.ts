import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { User } from '@auth/entities'
import { TeamSide } from '@teams/interface'
import { DataSource, Repository } from 'typeorm'

import { Player } from './entities'
import { PlayerType } from './interface'

@Injectable()
export class PlayersRepository extends Repository<Player> {
  constructor(dataSource: DataSource) {
    super(Player, dataSource.createEntityManager())
  }

  async createPlayer(
    user: User,
    side: TeamSide,
    playerType: PlayerType
  ): Promise<Player> {
    const player = this.create({
      user: user,
      side,
      type: playerType,
      resource: 3,
      vitality: 4,
      hasMadeAction: false,
      victoryPoints: 0,
    })
    try {
      await this.save(player)
    } catch (error) {
      // Duplicate player
      if (error.code === '23505')
        throw new ConflictException('A player with that ID already exists.')
      else throw new InternalServerErrorException()
    }

    return player
  }
}
