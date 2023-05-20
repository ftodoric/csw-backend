import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { CreatePlayerDto } from './dto'
import { Player } from './entities'
import { PlayersRepository } from './players.repository'

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository
  ) {}

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<Player> {
    return this.playersRepository.createPlayer(createPlayerDto)
  }

  /**
   * Each entity players has a flag that indicated whether he made an action during ths turn.
   * This is that setter.
   * @param playerId
   */
  async setPlayerMadeAction(playerId: string): Promise<void> {
    this.playersRepository.setPlayerMadeAction(playerId)
  }

  async resetPlayerMadeAction(playerId: string): Promise<void> {
    this.playersRepository.resetPlayerMadeAction(playerId)
  }
}
