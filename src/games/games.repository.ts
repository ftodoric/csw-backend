import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GameDto } from './dto/game.dto';
import { Game } from './game.entity';

@Injectable()
export class GamesRepository extends Repository<Game> {
  constructor(dataSource: DataSource) {
    super(Game, dataSource.createEntityManager());
  }

  async createGame(gameDto: GameDto): Promise<void> {
    const { name } = gameDto;

    const game = this.create({ name });
    try {
      await this.save(game);
    } catch (error) {
      // Duplicate game
      if (error.code === '23505')
        throw new ConflictException('Username already exists.');
      else throw new InternalServerErrorException();
    }
  }
}
