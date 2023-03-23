import { Body, Controller, Post } from '@nestjs/common';
import { GameDto } from './dto/game.dto';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post('/create')
  async createNewGame(@Body() gameDto: GameDto) {
    return this.gamesService.createGame(gameDto);
  }
}
