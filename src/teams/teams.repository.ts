import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import { DataSource, Repository } from 'typeorm'

import { TeamDto } from './dto'
import { Team } from './entities'

@Injectable()
export class TeamsRepository extends Repository<Team> {
  constructor(dataSource: DataSource) {
    super(Team, dataSource.createEntityManager())
  }

  async getTeamById(id: string): Promise<Team> {
    try {
      const team = await this.findOneBy({ id })
      return team
    } catch (error) {
      throw new NotFoundException('Team with provided ID not found.')
    }
  }

  async createTeam(teamDto: TeamDto): Promise<Team> {
    const team = this.create(teamDto)

    try {
      await this.save(team)
    } catch (error) {
      throw new InternalServerErrorException('Team creation failed.')
    }

    return team
  }
}
