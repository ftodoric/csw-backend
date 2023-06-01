import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { Asset } from '@assets/entities'
import { User } from '@auth/decorators'
import { User as UserEntity } from '@auth/entities'
import { JwtAuthGuard } from '@auth/jwt-auth.guard'
import { TeamSide } from '@teams/interface'

import {
  MAX_AMOUNT_OF_REVITALIZATION,
  MAX_NUMBER_OF_RESOURCE_PER_TRANSFER,
  isAttackAllowed,
  revitalisationConversionRate,
} from './config/game-mechanics'
import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesService } from './games.service'
import { BidPayload, GameAction, GameActionPayload, GameStatus } from './interface/game.types'

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
  async action(@Param('id') gameId, @Param('type') actionType, @Body() data: GameActionPayload): Promise<void> {
    // General check for all action tpes
    const game = await this.gamesService.getGameById(gameId)
    if (data.entityPlayer.side !== game.activeSide)
      throw new BadRequestException("Action not allowed. Not player's turn.")

    if (game.status !== GameStatus.InProgress)
      throw new BadRequestException('Action not allowed. Game is not in progress.')

    switch (actionType) {
      case GameAction.DISTRIBUTE:
        // Check if payload has the correct data
        if (!data.targetPlayerId || !data.resourceAmount) {
          throw new BadRequestException(
            "Distribute action requires both the 'targetPlayerId' and the 'resourcemount' payload fields."
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
        // Check if the payload has the correct data
        if (data.revitalizationAmount === undefined) {
          throw new BadRequestException("Revitalise action requires 'revitalizationAmount' payload field.")
        }

        // Check for maximum amount that can be spent
        if (data.revitalizationAmount > MAX_AMOUNT_OF_REVITALIZATION) {
          throw new BadRequestException(
            `Revitalization can be performed up to ${MAX_AMOUNT_OF_REVITALIZATION} vitality.`
          )
        }

        // Check if user has enough resource to spend
        if (revitalisationConversionRate[data.revitalizationAmount] > data.entityPlayer.resource) {
          throw new BadRequestException("Player doesn't have enough resource to spend.")
        }

        await this.gamesService.revitalise(data.entityPlayer.id, data.revitalizationAmount)

        break

      case GameAction.ATTACK:
        // Check if the payload has the correct data
        if (data.resourceAmount === undefined || data.diceRoll === undefined) {
          throw new BadRequestException("Attack action requires 'resourceAmount' and 'diceRoll' payload fields.")
        }

        // Check if the player is allowed to attack
        if (!isAttackAllowed(game, data.entityPlayer)) {
          throw new BadRequestException('Player is not allowed an attack.')
        }

        // Check if the player has enough resources
        if (data.resourceAmount > data.entityPlayer.resource) {
          throw new BadRequestException("Player doesn't have enough resource to spend.")
        }

        // Check if the dice roll is in correct boundaries
        if (data.diceRoll > 6 || data.diceRoll < 1) {
          throw new BadRequestException('Dice roll result not in 1 to 6 interval.')
        }

        await this.gamesService.attack(game, data.entityPlayer, data.resourceAmount, data.diceRoll)

        break

      case GameAction.ACCESS_BLACK_MARKET:
      case GameAction.ABSTAIN:
      default:
        break
    }

    await this.gamesService.setNextTurnIfLastTeamAction(gameId, data.entityPlayer)
  }

  @Get('/:id/blackMarket')
  async getBlackMarketAssets(@Param('id') gameId): Promise<Asset[]> {
    return this.gamesService.getBlackMarketAssets(gameId)
  }

  @Get('/:id/assets/:teamSide')
  async getTeamsAssets(@Param('id') gameId, @Param('teamSide') teamSide: TeamSide): Promise<Asset[]> {
    // Check if game exists

    // Check if team side is correct
    if (teamSide !== TeamSide.Blue && teamSide !== TeamSide.Red) {
      throw new BadRequestException('Team side is incorrect.')
    }

    return this.gamesService.getTeamAssets(gameId, teamSide)
  }

  @Post('/bid/:assetId')
  async makeAssetBid(@Param('assetId') assetId: string, @Body() data: BidPayload): Promise<void> {
    // Check if payload correct
    if (data.bid === undefined || data.teamSide === undefined || data.entityPlayer === undefined) {
      throw new BadRequestException("Bid payload requires 'bid' and 'teamSide'.")
    }

    await this.gamesService.makeAssetBid(assetId, data.bid, data.teamSide, data.entityPlayer.id)
  }
}
