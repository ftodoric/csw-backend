import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AssetsService } from '@assets'
import { Asset } from '@assets/entities'
import { AssetName, AssetStatus, AssetType } from '@assets/interface'
import { AuthService } from '@auth'
import { User } from '@auth/entities'
import { EventCardsService } from '@event-cards'
import { EventCardName, EventCardStatus } from '@event-cards/interface'
import { PlayersService } from '@players'
import { Player } from '@players/entities'
import { PlayerType } from '@players/interface'
import { TeamsService } from '@teams'
import { TeamSide } from '@teams/interface'

import { assets } from './config/assets'
import {
  GOVERNMENT_NEW_TURN_RESOURCE_ADDITION,
  INITIAL_VITALITY,
  TURN_TIME,
  attackSplashMap,
  attackTargetMap,
  combatResolutionTable,
  getNextTurnActives,
} from './config/game-mechanics'
import { CreateGameDto } from './dto'
import { Game } from './entities'
import { GamesRepository } from './games.repository'
import { GameAction, GameOutcome, GamePeriod, GameStatus } from './interface/game.types'
import { TimerGateway } from './timer.gateway'
import { calculateDamage, gameEntityMap } from './utils/utils'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    private authService: AuthService,
    private teamsService: TeamsService,
    @Inject(forwardRef(() => PlayersService)) private playersService: PlayersService,
    private assetsService: AssetsService,
    private eventCardsService: EventCardsService,
    @Inject(forwardRef(() => TimerGateway)) private timerGateway: TimerGateway
  ) {}

  /**
   * This method creates players for each entitity, two teams with their respective player
   * and finally a game with the two created teams.
   * @param gameDto
   * @param user
   * @returns
   */
  async createGame(gameDto: CreateGameDto, user: User): Promise<string> {
    // Find all users
    const electorateUser = await this.authService.getUserById(gameDto.electorateUserId)
    const ukPlcUser = await this.authService.getUserById(gameDto.ukPlcUserId)
    const ukGovernmentUser = await this.authService.getUserById(gameDto.ukGovernmentUserId)
    const ukEnergyUser = await this.authService.getUserById(gameDto.ukEnergyUserId)
    const gchqUser = await this.authService.getUserById(gameDto.gchqUserId)

    const onlineTrollsUser = await this.authService.getUserById(gameDto.onlineTrollsUserId)
    const energeticBearUser = await this.authService.getUserById(gameDto.energeticBearUserId)
    const russianGovernmentUser = await this.authService.getUserById(gameDto.russianGovernmentUserId)
    const rosenergoatomUser = await this.authService.getUserById(gameDto.rosenergoatomUserId)
    const scsUser = await this.authService.getUserById(gameDto.scsUserId)

    // Create all of the event cards
    // Draw a random card in the beginning and on each new turn
    const cards = Object.keys(EventCardName)
    for (let i = 0; i < 7; i++) {
      cards.push('UneventfulMonth')
    }
    let random = Math.floor(Math.random() * cards.length - 1)

    // Create blue team players
    const electoratePlayer = await this.playersService.createPlayer({
      user: electorateUser,
      side: TeamSide.Blue,
      playerType: PlayerType.People,
    })
    const ukPlcPlayer = await this.playersService.createPlayer({
      user: ukPlcUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Industry,
    })
    const ukGovernmentPlayer = await this.playersService.createPlayer({
      user: ukGovernmentUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Government,
    })
    const ukEnergyPlayer = await this.playersService.createPlayer({
      user: ukEnergyUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Energy,
    })
    const gchqPlayer = await this.playersService.createPlayer({
      user: gchqUser,
      side: TeamSide.Blue,
      playerType: PlayerType.Intelligence,
    })

    // Create red team players
    const onlineTrollsPlayer = await this.playersService.createPlayer({
      user: onlineTrollsUser,
      side: TeamSide.Red,
      playerType: PlayerType.People,
    })
    const energeticBearPlayer = await this.playersService.createPlayer({
      user: energeticBearUser,
      side: TeamSide.Red,
      playerType: PlayerType.Industry,
    })
    const russianGovernmentPlayer = await this.playersService.createPlayer(
      {
        user: russianGovernmentUser,
        side: TeamSide.Red,
        playerType: PlayerType.Government,
      },
      EventCardName[cards[random]] === EventCardName.PeoplesRevolt
    )
    const rosenergoatomPlayer = await this.playersService.createPlayer({
      user: rosenergoatomUser,
      side: TeamSide.Red,
      playerType: PlayerType.Energy,
    })
    const scsPlayer = await this.playersService.createPlayer({
      user: scsUser,
      side: TeamSide.Red,
      playerType: PlayerType.Intelligence,
    })

    // Create two teams and assign players to each team entity
    const blueTeam = await this.teamsService.createTeam({
      side: TeamSide.Blue,
      name: gameDto.blueTeamName,
      peoplePlayer: electoratePlayer,
      industryPlayer: ukPlcPlayer,
      governmentPlayer: ukGovernmentPlayer,
      energyPlayer: ukEnergyPlayer,
      intelligencePlayer: gchqPlayer,
    })

    const redTeam = await this.teamsService.createTeam({
      side: TeamSide.Red,
      name: gameDto.redTeamName,
      peoplePlayer: onlineTrollsPlayer,
      industryPlayer: energeticBearPlayer,
      governmentPlayer: russianGovernmentPlayer,
      energyPlayer: rosenergoatomPlayer,
      intelligencePlayer: scsPlayer,
    })

    // Create a game with both sides
    const gameId = await this.gamesRepository.createGame({
      ownerId: user.id,
      blueTeam: blueTeam,
      redTeam: redTeam,
      status: GameStatus.NotStarted,
      description: gameDto.description,
      turnsRemainingTime: TURN_TIME,
      activeSide: TeamSide.Red,
      activePeriod: GamePeriod.January,
      drawnEventCard: EventCardName[cards[random]],
    })

    cards.forEach(async (card, i) => {
      if (i === random) {
        await this.eventCardsService.createCard({ name: EventCardName[card], status: EventCardStatus.Drawn }, gameId)
      } else {
        await this.eventCardsService.createCard({ name: EventCardName[card], status: EventCardStatus.InDeck }, gameId)
      }
    })

    // Apply first month card effect
    await this.applyEventCardEffect(gameId)

    // Create all of the assets
    // Supply a random asset to the black market on the beginning
    random = Math.floor(Math.random() * assets.length - 1)
    assets.forEach(async (asset, i) => {
      if (i === random) {
        await this.assetsService.createAsset({ ...asset, status: AssetStatus.Bidding }, gameId)
      } else {
        await this.assetsService.createAsset({ ...asset, status: AssetStatus.NotSuppliedToMarket }, gameId)
      }
    })

    return gameId
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user)
  }

  async getGameById(id: string): Promise<Game> {
    return await this.gamesRepository.getGameById(id)
  }

  async getPlayerById(id: string): Promise<Player> {
    return await this.playersService.getPlayerById(id)
  }

  async nextTurn(gameId: string) {
    const game = await this.gamesRepository.getGameById(gameId)

    let team
    if (game.activeSide === TeamSide.Blue) {
      team = await this.teamsService.getTeamById(game.blueTeam.id)
    } else {
      team = await this.teamsService.getTeamById(game.redTeam.id)
    }

    // Reduce counters for all active bans for previous active team
    await this.playersService.decrementConditionCounters(gameId, game.activeSide)

    // After every month
    if (game.activeSide === TeamSide.Blue) {
      // Check for objectives
      await this.checkMonthlyObjectives(gameId, game.activePeriod)

      // Lift Banking Error resource transferal ban
      await this.teamsService.setCanTransferResource(game[game.activeSide].id, true)
    }

    // Recovery management
    if (game.isRecoveryManagementActive && game.blueTeam.industryPlayer.hasSufferedAnyDamage) {
      await this.playersService.addVitality(game.blueTeam.industryPlayer.id, 1)
    }

    // Reset made actions counter to active team
    await this.teamsService.resetTeamActions(team.id)

    // Reset flags for both teams
    await this.teamsService.resetBothTeamsActions(game.blueTeam.id, game.redTeam.id)

    // Check if game ended
    const isGameOver = game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Blue
    if (isGameOver) {
      await this.setGameOver(gameId)

      await this.timerGateway.stopTimer(gameId)
    } else {
      // Determine whether a team gets an asset
      await this.assetsService.checkIfAnyBidOnMarketIsWon(gameId, game.activeSide)

      // Supply another asset to the market every month
      if (game.activeSide === TeamSide.Blue) {
        await this.assetsService.supplyAssetToMarket(gameId)

        // Draw an Event Card each month
        const drawnCard = await this.eventCardsService.drawCard(gameId)
        await this.gamesRepository.save({
          id: gameId,
          drawnEventCard: drawnCard,
        })
        await this.teamsService.setEventCardRead(game.blueTeam.id, false)
        await this.teamsService.setEventCardRead(game.redTeam.id, false)

        await this.applyEventCardEffect(gameId)
      }

      const { nextSide, nextPeriod } = await getNextTurnActives(game.activeSide, game.activePeriod)

      // On beginning of the team's turn reset their made action types
      // Retain them during the opponents turn for information
      const players = Object.values(PlayerType)
      for (let i = 0; i < players.length; i++) {
        await this.playersService.resetPlayerMadeAction(game[nextSide][players[i]].id)
      }

      await this.gamesRepository.save({
        id: game.id,
        // Reset and checkpoint the time
        turnsRemainingTime: TURN_TIME,
        // Change actives
        activeSide: nextSide,
        activePeriod: nextPeriod,
      })

      const { drawnEventCard } = await this.getGameById(gameId)

      // Event Card People's Revolt effect
      if (!(drawnEventCard === EventCardName.PeoplesRevolt && game.activeSide === TeamSide.Blue)) {
        await this.playersService.addResources(
          game[nextSide].governmentPlayer.id,
          GOVERNMENT_NEW_TURN_RESOURCE_ADDITION
        )
      }

      await this.timerGateway.handleRestartTimer(game.id)
    }
  }

  async setPlayerMadeAction(playerId: string, madeAction: GameAction) {
    await this.playersService.setPlayerMadeAction(playerId, madeAction)
  }

  async setGameOver(gameId: string) {
    let game = await this.getGameById(gameId)

    // 1. FINAL OBJECTIVES
    // UK Government - Agressive Outlook
    const russianGovernmentVitality = Number(game.redTeam.governmentPlayer.vitality)
    if (russianGovernmentVitality < INITIAL_VITALITY) {
      await this.playersService.addVictoryPoints(game.blueTeam.governmentPlayer.id, 5)
    }

    // GCHQ - Recruitment Drive
    // Check the streak and award accordingly
    const recruitmentDriveBonus = Math.max(2 * game.recruitmentDriveMaxQuartersStreak - 1, 0)
    await this.playersService.addVictoryPoints(game.blueTeam.intelligencePlayer.id, recruitmentDriveBonus)

    // Rosenergoatom - Grow capacity
    // Check the streak and award accordingly
    const growCapacityBonus = Math.max(2 * game.growCapacityMaxQuartersStreak - 1, 0)
    await this.playersService.addVictoryPoints(game.redTeam.energyPlayer.id, growCapacityBonus)

    // 2. POINTS CALCULATION
    game = await this.getGameById(gameId)

    // Accumulate all victory points on each side of the team
    const blueTeamVP =
      game.blueTeam.peoplePlayer.victoryPoints +
      game.blueTeam.industryPlayer.victoryPoints +
      game.blueTeam.governmentPlayer.victoryPoints +
      game.blueTeam.energyPlayer.victoryPoints +
      game.blueTeam.intelligencePlayer.victoryPoints

    const redTeamVP =
      game.redTeam.peoplePlayer.victoryPoints +
      game.redTeam.industryPlayer.victoryPoints +
      game.redTeam.governmentPlayer.victoryPoints +
      game.redTeam.energyPlayer.victoryPoints +
      game.redTeam.intelligencePlayer.victoryPoints

    // Team with more VP wins
    if (blueTeamVP > redTeamVP) {
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.BlueVictory)
    } else if (redTeamVP > blueTeamVP) {
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.RedVictory)
    } else {
      await this.gamesRepository.setGameOutcome(game.id, GameOutcome.Tie)
    }

    await this.gamesRepository.setGameStatus(game.id, GameStatus.Finished)
  }

  async pauseGame(gameId: string, remainingTime: number) {
    this.gamesRepository.pauseGame(gameId, remainingTime)
  }

  async continueGame(gameId: string): Promise<void> {
    await this.gamesRepository.setGameStatus(gameId, GameStatus.InProgress)
  }

  async sendResource(sourcePlayerId: string, targetPlayerId: string, resourceAmount: number): Promise<void> {
    await this.playersService.sendResources(sourcePlayerId, targetPlayerId, resourceAmount)

    // Electorate objective - Resist the Drain
    const player = await this.playersService.getPlayerById(sourcePlayerId)
    if (player.side == TeamSide.Blue && player.type === PlayerType.People) {
      this.playersService.addVictoryPoints(player.id, -1)
    }
  }

  async revitalise(gameId: string, playerId: string, revitalizationAmount: number): Promise<void> {
    await this.playersService.revitalise(playerId, revitalizationAmount)

    // Raise GCHQ flag for Recruitment Drive objective
    // or
    // Rosenergoatom for Grow Cpacity objective
    const game = await this.gamesRepository.getGameById(gameId)
    if (playerId === game.blueTeam.intelligencePlayer.id) {
      await this.gamesRepository.save({
        id: gameId,
        didGCHQRevitaliseThisQuarter: true,
      })
    } else if (playerId === game.redTeam.energyPlayer.id) {
      await this.gamesRepository.save({
        id: gameId,
        didRosenergoatomRevitaliseThisQuarter: true,
      })
    }
  }

  async reducePlayerVitalityAndCheckIfGameOver(gameId: string, playerId: string, amount: number): Promise<void> {
    const { vitality: newVitality } = await this.playersService.reducePlayerVitality(playerId, amount)

    if (Number(newVitality) === 0) {
      await this.setGameOver(gameId)
      await this.timerGateway.stopTimer(gameId)
    }
  }

  async attack(game: Game, entityPlayer: Player, resourceSpent: number): Promise<void> {
    // Roll the dice
    const min = 1
    const max = 7
    const diceRoll = Math.floor(Math.random() * (max - min) + min)

    const attackStrength = combatResolutionTable[resourceSpent - 1][diceRoll - 1]

    // Russian Government objective - Control the Trolls
    const isOnlineTrolls = entityPlayer.side === TeamSide.Red && entityPlayer.type === PlayerType.People
    if (isOnlineTrolls) {
      if (resourceSpent === 3 || resourceSpent === 4) {
        await this.playersService.addVictoryPoints(game.redTeam.governmentPlayer.id, -1)
      } else if (resourceSpent === 5 || resourceSpent === 6) {
        await this.playersService.addVictoryPoints(game.redTeam.governmentPlayer.id, -2)
      }
    }

    // Online Trolls objective - Success breeds confidence
    if (isOnlineTrolls && resourceSpent >= 3 && entityPlayer.hasRansomwareAttack) {
      await this.playersService.addVictoryPoints(entityPlayer.id, 4)
    }

    const targetSide = entityPlayer.side === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue
    const targetType = attackTargetMap[entityPlayer.side][entityPlayer.type]

    const targetPlayerId = game[targetSide][targetType].id

    // Use Stuxnet effect
    // If not successful, still spend the effect
    await this.playersService.deactivateDoubleDamage(entityPlayer.id)

    let damage
    if (attackStrength > 0) {
      // If attacker has ransomware successful attack, apply the paralysis
      if (entityPlayer.hasRansomwareAttack) {
        await this.playersService.paralyze(game.id, targetSide, targetType, 2)
        await this.playersService.setWasRansomwareAttacked(targetPlayerId, true)
      }

      // If Stuxnet is in effect double the damage before applying armor
      damage = entityPlayer.hasDoubleDamage ? attackStrength * 2 : attackStrength

      // Apply armor
      damage = calculateDamage(damage, game[targetSide][targetType].armor, game[targetSide][targetType].armorDuration)

      // If target has immunity, deal no damage
      // But do the splash damage
      const hasImmunity = game[targetSide][targetType].damageImmunityDuration > 0
      damage = hasImmunity ? 0 : damage
    } else {
      damage = calculateDamage(Math.abs(attackStrength), entityPlayer.armor, entityPlayer.armorDuration)
    }

    // Ransomware attack is one time use
    await this.playersService.deactivateRansomware(entityPlayer.id)

    // Deduce the players vitality points
    const player =
      attackStrength > 0
        ? await this.playersService.reducePlayerVitality(targetPlayerId, damage)
        : await this.playersService.reducePlayerVitality(entityPlayer.id, damage)

    // Reduce attackers resource
    await this.playersService.reducePlayerResource(entityPlayer.id, resourceSpent)

    // Do the splash damage
    // Use regular for loop for synchronicity
    for (let i = 0; i < attackSplashMap[player.side][player.type].length; i++) {
      const splashSide = player.side
      const splashType = attackSplashMap[player.side][player.type][i]

      const splashPlayerId = game[splashSide][splashType].id

      // Apply armor
      damage = calculateDamage(
        Math.abs(attackStrength),
        game[splashSide][splashType].armor,
        game[splashSide][splashType].armorDuration
      )

      // Check if Network Policy is in effect
      damage = game[splashSide][splashType].isSplashImmune ? 0 : damage / 2

      await this.playersService.reducePlayerVitality(splashPlayerId, damage)
    }

    // Attribution level
    // Apply effects or assign assets to a team
    await this.determineAttributionLevel(game.id, attackStrength, entityPlayer.side, entityPlayer.type)

    // Check for 0 vitalities
    // If encountered, end the game
    let attackEndedTheGame = false
    const refreshedGame = await this.getGameById(game.id)
    const playerTypes = Object.values(PlayerType)

    for (let i = 0; i < playerTypes.length; i++) {
      const vitality = Number(refreshedGame.blueTeam[playerTypes[i]].vitality)
      if (vitality === 0) {
        attackEndedTheGame = true
        // If Red Team attacked, reward Red Team 10 VP
        // If Blue Team attacked and caused some of it's own entities to drop to 0, do not reward anyone
        if (entityPlayer.side === TeamSide.Red) {
          await this.playersService.addVictoryPoints(game[entityPlayer.side][entityPlayer.type].id, 10)
          break
        }
        break
      }
    }
    for (let i = 0; i < playerTypes.length; i++) {
      const vitality = Number(refreshedGame.redTeam[playerTypes[i]].vitality)
      if (vitality === 0) {
        attackEndedTheGame = true
        // Reward Blue Team 10 VP
        if (entityPlayer.side === TeamSide.Blue) {
          await this.playersService.addVictoryPoints(game[entityPlayer.side][entityPlayer.type].id, 10)
          break
        }
      }
    }

    if (attackEndedTheGame) {
      await this.setGameOver(game.id)
      await this.timerGateway.stopTimer(game.id)
    }

    await this.gamesRepository.save({
      id: game.id,
      lastAttacker: gameEntityMap(entityPlayer.side, entityPlayer.type),
      lastAttackStrength: attackStrength,
    })
  }

  async getBlackMarketAssets(gameId: string): Promise<Asset[]> {
    return await this.assetsService.getBlackMarketAssets(gameId)
  }

  async getTeamAssets(gameId: string, teamSide: TeamSide): Promise<Asset[]> {
    return await this.assetsService.getTeamAssets(gameId, teamSide)
  }

  async makeAssetBid(assetId: string, bidAmount: number, side: TeamSide, playerId: string): Promise<void> {
    // Raise madeBid flag
    await this.playersService.madeBid(playerId)

    // Take the players resource
    await this.playersService.reducePlayerResource(playerId, bidAmount)

    // Place the bid
    await this.assetsService.makeBid(assetId, side, bidAmount)
  }

  /**
   * To give an asset to one team, asset must not be already secured. In that case, no asset is given.
   *
   * First, check if any assets exist that are not yet bid on, assign one of those.
   *
   * Second, if there are only available assets that are in bidding process, cancel the bidding process
   * and assign it as a penalty.
   * @param attackStrength
   * @param side
   * @param playerType
   */
  async determineAttributionLevel(
    gameId: string,
    attackStrength: number,
    side: TeamSide,
    playerType: PlayerType
  ): Promise<void> {
    // -1 PENALTIES
    if (attackStrength === -1) {
      // Red Team penalties
      if (side === TeamSide.Red) {
        // -1 Penalty for Energetic Bear or SCS
        // UK gains Software Update asset.
        if (playerType === PlayerType.Industry || playerType === PlayerType.Intelligence) {
          this.giveAssetToTeam(gameId, 'Software Update', TeamSide.Blue)
        }

        // -1 Penalty for Online Trolls
        // UK gains Education asset.
        if (playerType === PlayerType.People) {
          this.giveAssetToTeam(gameId, 'Education', TeamSide.Blue)
        }

        // -1 Penalty for SCS
        // SCS cannot bid on Black Market for 2 turns.
        if (playerType === PlayerType.Intelligence) {
          // Add a ban to queue
          // When set to negative value, next turn turns it to its equivalent positive to mark beginning of the ban
          await this.playersService.banBidding(gameId, side, playerType, -2)
        }
      }

      // Blue Team penalties
      else {
        // -1 Penalty for GCHQ
        // GCHQ cannot launch attacks for 2 turns.
        if (playerType === PlayerType.Intelligence) {
          await this.playersService.banAttack(gameId, side, playerType, -2)
        }

        // -1 Penalty for UK Government
        // Russia gains Bargaining Chip asset.
        if (playerType === PlayerType.Government) {
          this.giveAssetToTeam(gameId, 'Bargaining Chip', TeamSide.Red)
        }
      }
    }

    // -2 PENALTIES
    else if (attackStrength === -2) {
      // Red Team penalties
      if (side === TeamSide.Red) {
        // -2 Penalty for Energetic Bear
        // UK gains Software Update and Recovery Management assets.
        if (playerType === PlayerType.Industry) {
          this.giveAssetToTeam(gameId, 'Software Update', TeamSide.Blue)
          this.giveAssetToTeam(gameId, 'Recovery Management', TeamSide.Blue)
        }

        // -2 Penalty for Online Trolls
        // UK gains Education asset, Online Trolls cannot launch attacks for 2 turns.
        if (playerType === PlayerType.People) {
          this.giveAssetToTeam(gameId, 'Education', TeamSide.Blue)
          await this.playersService.banAttack(gameId, side, playerType, -2)
        }

        // -2 Penalty for SCS
        // UK may choose to open up GCHQ-Rosenergoatom or UK Government-Russia Government attack vector at no cost.
        // This will not consume any existing assets, only create a new one for as many times as needed
        if (playerType === PlayerType.Intelligence) {
          const specialAssetId = await this.assetsService.createAsset(
            {
              name: AssetName.AttackVector,
              type: AssetType.Attack,
              effectDescription:
                'Opens up GCQH - Rosenergoatom or UK Government - Russian Government attack vector, at no cost.',
              minimumBid: 0,
              status: AssetStatus.Secured,
            },
            gameId
          )

          await this.assetsService.giveAssetToTeam(specialAssetId, TeamSide.Blue)
        }
      }

      // Blue Team penalties
      else {
        // -2 Penalty for GCHQ
        // GCHQ cannot perform any actions for 2 turns, UK Government loses 1 Vitality.
        if (playerType === PlayerType.Intelligence) {
          this.playersService.paralyze(gameId, side, playerType, -2)

          const game = await this.getGameById(gameId)
          await this.playersService.reducePlayerVitality(game.blueTeam.governmentPlayer.id, 1)
        }

        // -2 Penalty for UK Government
        // Russia gains Bargaining Chip asset, UK Government lose additional 2 Vitality and 2 Resource.
        if (playerType === PlayerType.Government) {
          this.giveAssetToTeam(gameId, 'Bargaining Chip', TeamSide.Red)

          const game = await this.getGameById(gameId)
          await this.playersService.reducePlayerVitality(game.blueTeam.governmentPlayer.id, 2)
          await this.playersService.reducePlayerResource(game.blueTeam.governmentPlayer.id, 2)
        }
      }
    }
  }

  async giveAssetToTeam(gameId: string, assetName: string, teamToGive: TeamSide): Promise<void> {
    let assetIdToGive: string | null = null

    const notBidOnAssets = await this.assetsService.getNotBidOnAssets(gameId)
    for (let i = 0; i < notBidOnAssets.length; i++) {
      if (notBidOnAssets[i].name === assetName) {
        assetIdToGive = notBidOnAssets[i].id
      }
    }

    const bidOnAssets = await this.assetsService.getBidOnAssets(gameId)
    if (assetIdToGive === null) {
      for (let i = 0; i < bidOnAssets.length; i++) {
        if (bidOnAssets[i].name === assetName) {
          assetIdToGive = bidOnAssets[i].id
        }
      }
    }

    // Give the asset if there is any
    if (assetIdToGive !== null) {
      await this.assetsService.giveAssetToTeam(assetIdToGive, teamToGive)
    }
  }

  async checkMonthlyObjectives(gameId: string, activePeriod: GamePeriod): Promise<void> {
    const game = await this.getGameById(gameId)

    // UK Government - Election Time
    if (game.blueTeam.peoplePlayer.resource >= 4) {
      await this.playersService.addVictoryPoints(game.blueTeam.governmentPlayer.id, 1)
    }

    // UK PLC - Weather the Brexit storm
    if (activePeriod === GamePeriod.April && game.blueTeam.industryPlayer.resource >= 3) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 2)
    } else if (activePeriod === GamePeriod.August && game.blueTeam.industryPlayer.resource >= 6) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 3)
    } else if (activePeriod === GamePeriod.December && game.blueTeam.industryPlayer.resource >= 9) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 4)
    }

    // GCHQ - Recruitment Drive streak
    if (activePeriod === GamePeriod.March) {
      await this.gamesRepository.adjustQuarterlyRecruitmentDriveStreak(gameId)
    }
    if (activePeriod === GamePeriod.June) {
      await this.gamesRepository.adjustQuarterlyRecruitmentDriveStreak(gameId)
    }
    if (activePeriod === GamePeriod.September) {
      await this.gamesRepository.adjustQuarterlyRecruitmentDriveStreak(gameId)
    }
    if (activePeriod === GamePeriod.December) {
      await this.gamesRepository.adjustQuarterlyRecruitmentDriveStreak(gameId)
    }

    // UK Energy - Grow Capacity
    if (activePeriod === GamePeriod.June && game.blueTeam.energyPlayer.vitality >= 6) {
      await this.playersService.addVictoryPoints(game.blueTeam.energyPlayer.id, 2)
    }
    if (activePeriod === GamePeriod.December && game.blueTeam.energyPlayer.vitality >= 9) {
      await this.playersService.addVictoryPoints(game.blueTeam.energyPlayer.id, 3)
    }

    // Russian Government - Some animals are more equal than others
    if (game.redTeam.governmentPlayer.resource >= 3) {
      await this.playersService.addVictoryPoints(game.redTeam.governmentPlayer.id, 1)
    }

    // Energetic Bear = Those who can't, steal
    if (activePeriod === GamePeriod.April) {
      if (game.redTeam.industryPlayer.vitality > INITIAL_VITALITY) {
        await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 1)
      }
      await this.gamesRepository.setEnergeticBearAprilVitality(game.id, Number(game.redTeam.industryPlayer.vitality))
    }
    if (activePeriod === GamePeriod.August) {
      if (game.redTeam.industryPlayer.vitality > game.energeticBearAprilVitality) {
        await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 3)
      }
      await this.gamesRepository.setEnergeticBearAugustVitality(game.id, Number(game.redTeam.industryPlayer.vitality))
    }
    if (
      activePeriod === GamePeriod.December &&
      game.redTeam.industryPlayer.vitality > game.energeticBearAugustVitality
    ) {
      await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 5)
    }

    // SCS - Win the arms race
    if (await this.assetsService.hasRussiaMoreAttackAssetsThanUKDefenceAssets(gameId)) {
      await this.playersService.addVictoryPoints(game.redTeam.intelligencePlayer.id, 2)
    }

    // Rosenergoatom - Grow Capacity streak
    if (activePeriod === GamePeriod.March) {
      await this.gamesRepository.adjustQuarterlyGrowCapacityStreak(gameId)
    }
    if (activePeriod === GamePeriod.June) {
      await this.gamesRepository.adjustQuarterlyGrowCapacityStreak(gameId)
    }
    if (activePeriod === GamePeriod.September) {
      await this.gamesRepository.adjustQuarterlyGrowCapacityStreak(gameId)
    }
    if (activePeriod === GamePeriod.December) {
      await this.gamesRepository.adjustQuarterlyGrowCapacityStreak(gameId)
    }
  }

  // ASSET ACTIVATIONS
  async activateAttackVector(gameId: string, teamSide: TeamSide, attackVectorTarget: PlayerType): Promise<void> {
    switch (attackVectorTarget) {
      case PlayerType.Government:
        this.gamesRepository.save({
          id: gameId,
          isRussianGovernmentAttacked: true,
        })
        break

      case PlayerType.Energy:
        if (teamSide === TeamSide.Blue) {
          this.gamesRepository.save({
            id: gameId,
            isRosenergoatomAttacked: true,
          })
        } else {
          this.gamesRepository.save({
            id: gameId,
            isUkEnergyAttacked: true,
          })
        }
        break

      default:
        break
    }
  }

  // Electorate suffers half of any damage for 3 turns
  async activateEducation(gameId: string): Promise<void> {
    const { blueTeam } = await this.gamesRepository.getGameById(gameId)
    await this.playersService.activateArmor(blueTeam.peoplePlayer.id, 50, 3)
  }

  // Russia Government suffers half of any damage for 3 turns
  async activateBargainingChip(gameId: string): Promise<void> {
    const { redTeam } = await this.gamesRepository.getGameById(gameId)
    await this.playersService.activateArmor(redTeam.governmentPlayer.id, 50, 3)
  }

  // If UK PLC suffered any damage this turn, increase vitality by 1
  async activateRecoveryManagement(gameId: string): Promise<void> {
    await this.gamesRepository.save({ id: gameId, isRecoveryManagementActive: true })
  }

  // Renders an entity immune to direct attacks for 2 turns
  async activateSoftwareUpdate(playerId: string): Promise<void> {
    await this.playersService.activateDamageImmunity(playerId, 2)
  }

  // Renders Entity immune for splash damage, but only 2 resource can be transferred to or from it each turn
  async activateNetworkPolicy(playerId: string): Promise<void> {
    await this.playersService.activateSplashImmunity(playerId)
  }

  // Direct attack from intelligence players deal double damage to energy players
  async activateStuxnet(playerId: string): Promise<void> {
    await this.playersService.activateDoubleDamage(playerId)
  }

  // Entity can revitalise at 1 less resource cost
  async activateCyberInvestmentProgramme(playerId: string): Promise<void> {
    await this.playersService.activateCyberInvestmentProgramme(playerId)
  }

  // Ransomware
  async activateRansomware(playerId: string): Promise<void> {
    await this.playersService.activateRansomware(playerId)
  }

  async setAssetActivated(assetId: string): Promise<void> {
    await this.assetsService.setAssetStatus(assetId, AssetStatus.Activated)
  }

  async payRansomwareAttacker(attackerId: string, victimId: string, yes: boolean): Promise<void> {
    if (yes) {
      // Pay 2 resource
      await this.playersService.sendResources(victimId, attackerId, 2)

      // Unparalyze
      await this.playersService.unparalyze(victimId)
    }
    // Else, keep resource and stay paralyzed

    // Reset flag
    await this.playersService.setWasRansomwareAttacked(victimId, false)
  }

  async readEventCard(gameId: string, teamSide: TeamSide): Promise<void> {
    const game = await this.gamesRepository.getGameById(gameId)

    await this.teamsService.setEventCardRead(game[teamSide].id, true)
  }

  // Return boolean did any card effect end the game
  async applyEventCardEffect(gameId: string) {
    const game = await this.gamesRepository.getGameById(gameId)

    switch (game.drawnEventCard) {
      case EventCardName.NuclearMeltdown:
        await this.reducePlayerVitalityAndCheckIfGameOver(gameId, game.blueTeam.energyPlayer.id, 1)
        break

      case EventCardName.ClumsyCivilServant:
        await this.reducePlayerVitalityAndCheckIfGameOver(gameId, game.blueTeam.peoplePlayer.id, 1)
        await this.playersService.reducePlayerResource(game.blueTeam.governmentPlayer.id, 2)
        break

      case EventCardName.SoftwareUpdate:
        await this.playersService.reducePlayerResource(game.blueTeam.industryPlayer.id, 2)
        break

      case EventCardName.BankingError:
        await this.teamsService.setCanTransferResource(game.blueTeam.id, false)
        break

      case EventCardName.Embargoed:
        break

      case EventCardName.LaxOpSec:
        await this.reducePlayerVitalityAndCheckIfGameOver(gameId, game.redTeam.governmentPlayer.id, 1)
        await this.playersService.reducePlayerResource(game.redTeam.governmentPlayer.id, 1)
        break

      case EventCardName.PeoplesRevolt:
        // Implemented in nextTurn method
        break

      case EventCardName.QuantumBreakthrough:
        const playerTypes = Object.values(PlayerType)
        for (let i = 0; i < playerTypes.length; i++) {
          // Add 1 resource
          await this.playersService.addResources(game.blueTeam[playerTypes[i]].id, 1)
          await this.playersService.addResources(game.redTeam[playerTypes[i]].id, 1)

          // Add 1 vitality
          await this.playersService.addVitality(game.blueTeam[playerTypes[i]].id, 1)
          await this.playersService.addVitality(game.redTeam[playerTypes[i]].id, 1)
        }
        break

      case EventCardName.UneventfulMonth:
      default:
        break
    }
  }
}
