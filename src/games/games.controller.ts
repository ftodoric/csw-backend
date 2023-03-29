import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/auth/user.decorator';
import { User as UserEntity } from 'src/auth/user.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { Game } from './game.entity';
import { GamesService } from './games.service';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  createNewGame(@Body() gameDto: CreateGameDto, @User() user: UserEntity) {
    return this.gamesService.createGame(gameDto, user);
  }

  @Get()
  getGames(@User() user): Promise<Game[]> {
    return this.gamesService.getGames(user);
  }
}
