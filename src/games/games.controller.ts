import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { User } from '@auth/decorators'
import { User as UserEntity } from '@auth/entities'
import { JwtAuthGuard } from '@auth/jwt-auth.guard'

import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesService } from './games.service'

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  createGame(
    @Body() gameDto: CreateGameDto,
    @User() user: UserEntity
  ): Promise<string> {
    return this.gamesService.createGame(gameDto, user)
  }

  @Get()
  getMyGames(@User() user): Promise<Game[]> {
    return this.gamesService.getGames(user)
  }

  @Get('/:id')
  getGameById(@Param('id') id): Promise<Game> {
    return this.gamesService.getGameById(id)
  }
}
