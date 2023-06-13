import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { Asset } from '@assets/entities'
import { AssetName } from '@assets/interface'
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
import {
  AssetActivationPayload,
  BidPayload,
  FinishTurnPayload,
  GameAction,
  GameStatus,
  RansomwarePaymentAnswer,
  RansomwarePaymentPayload,
} from './interface/game.types'

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

  @Post('/action/:type')
  async action(@Param('type') actionType, @Body() data: { playerId: string }): Promise<void> {
    await this.gamesService.setPlayerMadeAction(data.playerId, actionType)
  }

  @Post('/:id/finishTurn')
  async finishTurn(@Param('id') gameId, @Body() data: FinishTurnPayload): Promise<void> {
    const game = await this.gamesService.getGameById(gameId)

    // Iterate through every player action
    for (const playerId in data) {
      const entityPlayer = data[playerId].entityPlayer
      const actionType = data[playerId].gameAction
      const gameActionPayload = data[playerId].gameActionPayload

      // General check for all action types
      if (entityPlayer.side !== game.activeSide) throw new BadRequestException("Action not allowed. Not player's turn.")

      if (game.status !== GameStatus.InProgress)
        throw new BadRequestException('Action not allowed. Game is not in progress.')

      switch (actionType) {
        case GameAction.DISTRIBUTE:
          // Check if payload has the correct data
          if (!gameActionPayload.targetPlayerId || !gameActionPayload.resourceAmount) {
            throw new BadRequestException(
              "Distribute action requires both the 'targetPlayerId' and the 'resourcemount' payload fields."
            )
          }

          // Check resource amount
          if (
            gameActionPayload.resourceAmount <= 0 ||
            gameActionPayload.resourceAmount > MAX_NUMBER_OF_RESOURCE_PER_TRANSFER
          ) {
            throw new BadRequestException(
              `Maximum amount of resource that can be transfered in one action is: 
              ${MAX_NUMBER_OF_RESOURCE_PER_TRANSFER} and minimum of 1.`
            )
          }

          // Check if source entity player has the amount that wants to be transfered
          if (entityPlayer.resource < gameActionPayload.resourceAmount) {
            throw new BadRequestException('Not enough resource to transfer.')
          }

          // Check if source or target entity has Network Polciy effect
          // Max 2 resources
          const targetPlayer = await this.gamesService.getPlayerById(gameActionPayload.targetPlayerId)
          if (entityPlayer.isSplashImmune || targetPlayer.isSplashImmune) {
            if (gameActionPayload.resourceAmount > 2) {
              throw new BadRequestException(
                "Network policy effect doesn't allow this distrbute action. Max. 2 resource can be transferred."
              )
            }
          }

          await this.gamesService.sendResource(
            entityPlayer.id,
            gameActionPayload.targetPlayerId,
            gameActionPayload.resourceAmount
          )

          break

        case GameAction.REVITALISE:
          // Check if the payload has the correct data
          if (gameActionPayload.revitalizationAmount === undefined) {
            throw new BadRequestException("Revitalise action requires 'revitalizationAmount' payload field.")
          }

          // Check for maximum amount that can be spent
          if (gameActionPayload.revitalizationAmount > MAX_AMOUNT_OF_REVITALIZATION) {
            throw new BadRequestException(
              `Revitalization can be performed up to ${MAX_AMOUNT_OF_REVITALIZATION} vitality.`
            )
          }

          // Check if user has enough resource to spend
          const cyberInvestmentProgrammeModifier = entityPlayer.hasCyberInvestmentProgramme ? 1 : 0
          if (
            revitalisationConversionRate[gameActionPayload.revitalizationAmount] >
            entityPlayer.resource - cyberInvestmentProgrammeModifier
          ) {
            throw new BadRequestException("Player doesn't have enough resource to spend.")
          }

          await this.gamesService.revitalise(gameId, entityPlayer.id, gameActionPayload.revitalizationAmount)

          break

        case GameAction.ATTACK:
          // Check if the payload has the correct data
          if (gameActionPayload.resourceAmount === undefined) {
            throw new BadRequestException("Attack action requires 'resourceAmount' payload field.")
          }

          // Check if the player is allowed to attack
          if (!isAttackAllowed(game, entityPlayer)) {
            throw new BadRequestException('Player is not allowed an attack.')
          }

          // Check if the player has enough resources
          if (gameActionPayload.resourceAmount > entityPlayer.resource) {
            throw new BadRequestException("Player doesn't have enough resource to spend.")
          }

          await this.gamesService.attack(game, entityPlayer, gameActionPayload.resourceAmount)

          break

        case GameAction.ACCESS_BLACK_MARKET:
        case GameAction.ABSTAIN:
        default:
          break
      }
    }

    await this.gamesService.nextTurn(gameId)
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

  @Post('/:gameId/activateAsset/:assetId')
  async activateAsset(
    @Param('gameId') gameId: string,
    @Param('assetId') assetId,
    @Body() data: AssetActivationPayload
  ): Promise<void> {
    // Check if team side is in the payload
    if (data.teamSide === undefined) {
      throw new BadRequestException("Activation of asset requires 'teamSide' field.")
    }

    // Check if it's team's turn
    const game = await this.gamesService.getGameById(gameId)
    if (data.teamSide !== game.activeSide) {
      throw new BadRequestException("It's not teams turn.")
    }

    // Check if requested asset is in team possesion
    const teamAssets = await this.gamesService.getTeamAssets(gameId, data.teamSide)
    let isTeamsAsset = false
    let assetName
    for (let i = 0; i < teamAssets.length; i++) {
      if (teamAssets[i].id === assetId) {
        isTeamsAsset = true
        assetName = teamAssets[i].name
      }
    }

    if (!isTeamsAsset) {
      throw new BadRequestException('Team does not posses the asset of requested activation.')
    }

    // Determine the asset
    switch (assetName) {
      case AssetName.AttackVector:
        // Check if payload contains 'attackVectorTarget'
        if (data.attackVectorTarget === undefined) {
          throw new BadRequestException("To activate Attack Vector asset, 'attackVectorTarget' is required in payload.")
        }

        await this.gamesService.activateAttackVector(gameId, data.teamSide, data.attackVectorTarget)
        break

      case AssetName.Education:
        await this.gamesService.activateEducation(gameId)
        break

      case AssetName.RecoveryManagement:
        await this.gamesService.activateRecoveryManagement(gameId)
        break

      case AssetName.SoftwareUpdate:
        // Check if payload contains 'softwareUpdateTarget'
        if (data.softwareUpdateTarget === undefined) {
          throw new BadRequestException(
            "To activate Software Update asset, 'softwareUpdateTarget' is required in payload."
          )
        }

        await this.gamesService.activateSoftwareUpdate(game[data.teamSide][data.softwareUpdateTarget].id)

        break

      case AssetName.BargainingChip:
        await this.gamesService.activateBargainingChip(gameId)
        break

      case AssetName.NetworkPolicy:
        // Check if payload contains 'networkPolicyTarget'
        if (data.networkPolicyTarget === undefined) {
          throw new BadRequestException(
            "To activate Network Policy asset, 'networkPolicyTarget' is required in payload."
          )
        }

        await this.gamesService.activateNetworkPolicy(game[data.teamSide][data.networkPolicyTarget].id)
        break

      case AssetName.Stuxnet20:
        await this.gamesService.activateStuxnet(game[data.teamSide].intelligencePlayer.id)
        break

      case AssetName.CyberInvestmentProgramme:
        // Check if payload contains 'cyberInvestmentProgrammeTarget'
        if (data.cyberInvestmentProgrammeTarget === undefined) {
          throw new BadRequestException(
            `To activate ${AssetName.CyberInvestmentProgramme} asset, 'cyberInvestmentProgrammeTarget' is required in payload.`
          )
        }

        await this.gamesService.activateCyberInvestmentProgramme(
          game[data.teamSide][data.cyberInvestmentProgrammeTarget].id
        )
        break

      case AssetName.Ransomware:
        // Check if payload contains 'ransomwareAttacker'
        if (data.ransomwareAttacker === undefined) {
          throw new BadRequestException(
            `To activate ${AssetName.Ransomware} asset, 'ransomwareAttacker' is required in payload.`
          )
        }

        await this.gamesService.activateRansomware(game[data.teamSide][data.ransomwareAttacker].id)

        break

      default:
        break
    }

    // Set the asset status
    await this.gamesService.setAssetActivated(assetId)
  }

  @Post('/payRansomwareAttacker/:answer')
  async payRansomwareAttacker(
    @Param('answer') answer: RansomwarePaymentAnswer,
    @Body() payload: RansomwarePaymentPayload
  ): Promise<void> {
    await this.gamesService.payRansomwareAttacker(
      payload.attackerId,
      payload.victimId,
      answer === RansomwarePaymentAnswer.Yes
    )
  }

  @Post('/:gameId/readEventCard/:teamSide')
  async readEventCard(@Param('gameId') gameId: string, @Param('teamSide') teamSide: TeamSide): Promise<void> {
    await this.gamesService.readEventCard(gameId, teamSide)
  }
}
