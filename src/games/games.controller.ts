import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { User } from '@auth/decorators'
import { User as UserEntity } from '@auth/entities'
import { JwtAuthGuard } from '@auth/jwt-auth.guard'

import { MAX_NUMBER_OF_RESOURCE_PER_TRANSFER } from './config/game-mechanics'
import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesService } from './games.service'
import { GameAction, GameActionPayload, GameStatus } from './interface/game.types'

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

    if (game.status !== GameStatus.InProgress)
      throw new BadRequestException('Action not allowed. Game is not in progress.')

    switch (actionType) {
      case GameAction.DISTRIBUTE:
        if (!data.targetPlayerId || !data.resourceAmount) {
          throw new BadRequestException(
            'Distribute action requires both the targeted entities player id and the amount of resource for transfer.'
          )
        }

        // Check with max number of resource in one action
        if (data.resourceAmount > MAX_NUMBER_OF_RESOURCE_PER_TRANSFER) {
          throw new BadRequestException(
            `Maximum amount of resource that can be transfered in one action is: ${MAX_NUMBER_OF_RESOURCE_PER_TRANSFER}.`
          )
        }

        // Check if source entity player has the amount that wants to be transfered
        if (data.entityPlayer.resource < data.resourceAmount) {
          throw new BadRequestException('Not enough resource to transfer.')
        }

        await this.gamesService.sendResource(data.entityPlayer.id, data.targetPlayerId, data.resourceAmount)

        break
      case GameAction.REVITALISE:
      case GameAction.ATTACK:
      case GameAction.ABSTAIN:
      default:
        break
    }

    await this.gamesService.setNextTurnIfLastTeamAction(gameId, data.entityPlayer)
  }
}
