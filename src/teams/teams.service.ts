import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PlayersService } from '@players'

import { TeamsRepository } from './teams.repository'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    private playersService: PlayersService
  ) {}

  async resetTeamActions(teamId: string) {
    const team = await this.teamsRepository.getTeamById(teamId)

    this.playersService.resetPlayerMadeAction(team.peoplePlayer.id)
    this.playersService.resetPlayerMadeAction(team.industryPlayer.id)
    this.playersService.resetPlayerMadeAction(team.governmentPlayer.id)
    this.playersService.resetPlayerMadeAction(team.energyPlayer.id)
    this.playersService.resetPlayerMadeAction(team.intelligencePlayer.id)
  }
}
