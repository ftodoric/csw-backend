import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PlayersRepository } from './players.repository'

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayersRepository)
    private playersRepository: PlayersRepository
  ) {}

  async resetHasMadeAction(playerId: string): Promise<void> {
    await this.playersRepository.save({
      id: playerId,
      hasMadeAction: false,
    })
  }
}
