import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { User } from 'src/auth/user.entity'
import { DataSource, Repository } from 'typeorm'

import { GameDto } from './dto/game.dto'
import { Game } from './game.entity'

@Injectable()
export class GamesRepository extends Repository<Game> {
  constructor(dataSource: DataSource) {
    super(Game, dataSource.createEntityManager())
  }

  async createGame(gameDto: GameDto): Promise<string> {
    const game = this.create(gameDto)
    try {
      await this.save(game)
    } catch (error) {
      // Duplicate game
      if (error.code === '23505')
        throw new ConflictException('A game with that ID already exists.')
      else throw new InternalServerErrorException()
    }

    return game.id
  }

  async getGames(user: User): Promise<Game[]> {
    const query = this.createQueryBuilder('game')
      .select('game.id')
      .addSelect('game.ownerId')
      .addSelect('game.status')
      .addSelect('game.description')
      .addSelect('blueTeam.name')
      .addSelect('redTeam.name')

      .leftJoin('game.blueTeam', 'blueTeam')
      .leftJoin('game.redTeam', 'redTeam')
      .leftJoinAndSelect('blueTeam.peoplePlayer', 'electoratePlayer')
      .leftJoinAndSelect('blueTeam.industryPlayer', 'ukPlcPlayer')
      .leftJoinAndSelect('blueTeam.governmentPlayer', 'ukGovernmentPlayer')
      .leftJoinAndSelect('blueTeam.energyPlayer', 'ukEnergyPlayer')
      .leftJoinAndSelect('blueTeam.intelligencePlayer', 'gchqPlayer')
      .leftJoinAndSelect('redTeam.peoplePlayer', 'onlineTrollsPlayer')
      .leftJoinAndSelect('redTeam.industryPlayer', 'energeticBearPlayer')
      .leftJoinAndSelect('redTeam.governmentPlayer', 'russianGovernmentPlayer')
      .leftJoinAndSelect('redTeam.energyPlayer', 'rosenergoatomPlayer')
      .leftJoinAndSelect('redTeam.intelligencePlayer', 'scsPlayer')
      .leftJoinAndSelect('game.winner', 'winner')

      .where('blueTeam.peoplePlayerId = :id', { id: user.id })
      .orWhere('blueTeam.industryPlayerId = :id', { id: user.id })
      .orWhere('blueTeam.governmentPlayerId = :id', { id: user.id })
      .orWhere('blueTeam.energyPlayerId = :id', { id: user.id })
      .orWhere('blueTeam.intelligencePlayerId = :id', { id: user.id })
      .orWhere('redTeam.peoplePlayerId = :id', { id: user.id })
      .orWhere('redTeam.industryPlayerId = :id', { id: user.id })
      .orWhere('redTeam.governmentPlayerId = :id', { id: user.id })
      .orWhere('redTeam.energyPlayerId = :id', { id: user.id })
      .orWhere('redTeam.intelligencePlayerId = :id', { id: user.id })
    return query.getMany()
  }

  async getGameById(id: string): Promise<Game> {
    const game = await this.findOneBy({ id: id })

    if (!game) throw new NotFoundException(`Game with ID ${id} not found.`)

    return game
  }
}
