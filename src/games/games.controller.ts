import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { User } from 'src/auth/user.decorator'
import { User as UserEntity } from 'src/auth/user.entity'

import { CreateGameDto } from './dto/create-game.dto'
import { Game } from './game.entity'
import { GamesService } from './games.service'

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  createNewGame(
    @Body() gameDto: CreateGameDto,
    @User() user: UserEntity
  ): Promise<string> {
    return this.gamesService.createGame(gameDto, user)
  }

  @Get()
  getGames(@User() user): Promise<Game[]> {
    return this.gamesService.getGames(user)
  }

  @Get('/:id')
  getGameById(@Param('id') id): Promise<Game> {
    console.log(
      '%clog | description\n',
      'color: #0e8dbf; margin-bottom: 5px;',
      id
    )
    return this.gamesService.getGameById(id)
  }
}
