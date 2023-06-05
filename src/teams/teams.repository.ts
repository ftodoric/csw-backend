import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import { DataSource, Repository } from 'typeorm'

import { TeamDto } from './dto'
import { Team } from './entities'

@Injectable()
export class TeamsRepository extends Repository<Team> {
  constructor(dataSource: DataSource) {
    super(Team, dataSource.createEntityManager())
  }

  async getTeamById(id: string): Promise<Team> {
    const team = await this.findOneBy({ id })

    if (!team) throw new NotFoundException(`Team with ID ${id} not found.`)

    return team
  }

  async createTeam(teamDto: TeamDto): Promise<Team> {
    const team = this.create({ ...teamDto, isEventCardRead: false })

    try {
      await this.save(team)
    } catch (error) {
      // Duplicate team
      if (error.code === '23505') throw new ConflictException(`Team with ID ${team.id} already exists.`)
      else throw new InternalServerErrorException('Team creation failed.')
    }

    return team
  }
}
