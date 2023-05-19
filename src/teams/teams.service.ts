import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PlayersService } from '@players'

import { TeamsRepository } from './teams.repository'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    @Inject(PlayersService) private playersService: PlayersService
  ) {}

  async resetAllHasMadeActions(teamId: string) {
    const team = await this.teamsRepository.findOneBy({ id: teamId })

    this.playersService.resetHasMadeAction(team.peoplePlayer.id)
    this.playersService.resetHasMadeAction(team.industryPlayer.id)
    this.playersService.resetHasMadeAction(team.governmentPlayer.id)
    this.playersService.resetHasMadeAction(team.energyPlayer.id)
    this.playersService.resetHasMadeAction(team.intelligencePlayer.id)
  }
}
