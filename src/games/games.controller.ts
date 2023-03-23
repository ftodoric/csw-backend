import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameDto } from './dto/game.dto';
import { Game } from './game.entity';
import { GamesService } from './games.service';

@Controller('games')
@UseGuards(AuthGuard())
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  createNewGame(@Body() gameDto: GameDto) {
    return this.gamesService.createGame(gameDto);
  }

  @Get()
  getGames(): Promise<Game[]> {
    return this.gamesService.getGames();
  }
}
