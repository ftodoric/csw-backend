import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { User } from '@auth/decorators'
import { User as UserEntity } from '@auth/entities'
import { JwtAuthGuard } from '@auth/jwt-auth.guard'

import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesService } from './games.service'
import { GameAction, GameActionPayload } from './interface/game.types'

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  createGame(@Body() gameDto: CreateGameDto, @User() user: UserEntity): Promise<string> {
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

  @Post('/:id/action/:type')
  async action(
    @Param('id') gameId,
    @Param('type') actionType,
    @User() user,
    @Body() data: GameActionPayload
  ): Promise<void> {
    // General check for all action tpes
    const game = await this.gamesService.getGameById(gameId)
    if (data.entityPlayer.side !== game.activeSide)
      throw new BadRequestException("Action not allowed. Not player's turn.")

    switch (actionType) {
      case GameAction.DISTRIBUTE:
      case GameAction.REVITALISE:
      case GameAction.ATTACK:
      case GameAction.ABSTAIN:
        break
    }

    await this.gamesService.setNextTurnIfLastTeamAction(gameId, data.entityPlayer)
  }
}
