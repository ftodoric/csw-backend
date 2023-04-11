import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { User } from '@auth/entities'
import { DataSource, Repository } from 'typeorm'

import { Player } from './entities'

@Injectable()
export class PlayersRepository extends Repository<Player> {
  constructor(dataSource: DataSource) {
    super(Player, dataSource.createEntityManager())
  }

  async createPlayer(user: User): Promise<Player> {
    const player = this.create({
      user: user,
      resource: 0,
      vitality: 0,
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
