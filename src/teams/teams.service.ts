import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PlayersService } from '@players'
import { PlayerType } from '@players/interface'

import { TeamDto } from './dto'
import { Team } from './entities'
import { TeamsRepository } from './teams.repository'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    private playersService: PlayersService
  ) {}

  async createTeam(teamDto: TeamDto): Promise<Team> {
    return this.teamsRepository.createTeam(teamDto)
  }

  async getTeamById(teamId: string): Promise<Team> {
    return this.teamsRepository.getTeamById(teamId)
  }

  async resetTeamActions(teamId: string) {
    const team = await this.teamsRepository.getTeamById(teamId)

    const playerTypes = Object.values(PlayerType)

    for (let i = 0; i < playerTypes.length; i++) {
      // Resest has made bid
      await this.playersService.resetPlayerMadeBid(team[playerTypes[i]].id)
    }
  }

  async resetBothTeamsActions(blueTeamId: string, redTeamId: string) {
    const blueTeam = await this.teamsRepository.getTeamById(blueTeamId)
    const redTeam = await this.teamsRepository.getTeamById(redTeamId)

    const playerTypes = Object.values(PlayerType)

    for (let i = 0; i < playerTypes.length; i++) {
      // Reset suffered damage flag
      await this.playersService.resetPlayerSufferedDamage(blueTeam[playerTypes[i]].id)
      await this.playersService.resetPlayerSufferedDamage(redTeam[playerTypes[i]].id)
    }
  }

  async setEventCardRead(teamId: string, value: boolean): Promise<void> {
    await this.teamsRepository.save({
      id: teamId,
      isEventCardRead: value,
    })
  }

  async setCanTransferResource(teamId: string, value: boolean): Promise<void> {
    await this.teamsRepository.save({
      id: teamId,
      canTransferResource: value,
    })
  }
}
