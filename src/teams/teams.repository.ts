import { Injectable, InternalServerErrorException } from '@nestjs/common'

import { DataSource, Repository } from 'typeorm'

import { TeamDto } from './dto'
import { Team } from './entities'

@Injectable()
export class TeamsRepository extends Repository<Team> {
  constructor(dataSource: DataSource) {
    super(Team, dataSource.createEntityManager())
  }

  async createTeam(teamDto: TeamDto): Promise<Team> {
    const team = this.create(teamDto)

    try {
      await this.save(team)
    } catch (error) {
      throw new InternalServerErrorException()
    }

    return team
  }
}
