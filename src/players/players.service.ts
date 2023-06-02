import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { revitalisationConversionRate } from '@games/config/game-mechanics'

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
    await this.playersRepository.setPlayerMadeAction(playerId)
  }

  async resetPlayerMadeAction(playerId: string): Promise<void> {
    this.playersRepository.resetPlayerMadeAction(playerId)
  }

  async resetPlayerMadeBid(playerId: string): Promise<void> {
    this.playersRepository.resetPlayerMadeBid(playerId)
  }

  async addResources(id: string, addition: number): Promise<void> {
    const player = await this.playersRepository.findOneBy({ id })
    await this.playersRepository.save({ id, resource: player.resource + addition })
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
      vitality: Math.max(player.vitality - attackStrength, 0),
    })

    return player
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
}
