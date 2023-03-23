import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameDto } from './dto/game.dto';
import { Game } from './game.entity';
import { GamesRepository } from './games.repository';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
  ) {}

  async createGame(gameDto: GameDto): Promise<void> {
    return this.gamesRepository.createGame(gameDto);
  }

  async getGames(): Promise<Game[]> {
    return this.gamesRepository.getGames();
  }
}
