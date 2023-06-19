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
import { calculateDamage, entityNameMap, gameEntityMap, gamePeriodMap } from './utils/utils'
import { WSGateway } from './ws.gateway'

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    private authService: AuthService,
    private teamsService: TeamsService,
    @Inject(forwardRef(() => PlayersService)) private playersService: PlayersService,
    @Inject(forwardRef(() => AssetsService)) private assetsService: AssetsService,
    private eventCardsService: EventCardsService,
    @Inject(forwardRef(() => WSGateway)) private wsGateway: WSGateway
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
    const allVitalities = [
      game.blueTeam.governmentPlayer.vitality,
      game.blueTeam.peoplePlayer.vitality,
      game.blueTeam.industryPlayer.vitality,
      game.blueTeam.energyPlayer.vitality,
      game.blueTeam.intelligencePlayer.vitality,

      game.redTeam.governmentPlayer.vitality,
      game.redTeam.peoplePlayer.vitality,
      game.redTeam.industryPlayer.vitality,
      game.redTeam.energyPlayer.vitality,
      game.redTeam.intelligencePlayer.vitality,
    ]
    const isGameOver =
      (game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Blue) ||
      allVitalities.some((vitality) => Number(vitality) === 0)
    if (isGameOver) {
      await this.setGameOver(gameId)

      // Attack method ended the game and stopped the timer
      if (!allVitalities.some((vitality) => Number(vitality) === 0)) {
        await this.wsGateway.stopTimer(gameId)
      }
    } else {
      const { nextSide, nextPeriod } = await getNextTurnActives(game.activeSide, game.activePeriod)

      // Supply another asset to the market every month
      if (game.activeSide === TeamSide.Blue) {
        await this.assetsService.supplyAssetToMarket(gameId)

        await this.addNewRecord(gameId, `<h1>${gamePeriodMap[nextPeriod]}</h1>`)
        const drawnCard = await this.eventCardsService.drawCard(gameId)
        await this.addNewRecord(gameId, `<p><span id="card">[EVENT CARD]</span> ${drawnCard} is drawn</p>`)

        // Draw an Event Card each month
        await this.gamesRepository.save({
          id: gameId,
          drawnEventCard: drawnCard,
        })
        await this.teamsService.setEventCardRead(game.blueTeam.id, false)
        await this.teamsService.setEventCardRead(game.redTeam.id, false)

        await this.applyEventCardEffect(gameId)
      }

      // Skip for Russian Side if Embargoed Card is drawn
      const { drawnEventCard } = await this.gamesRepository.getGameById(gameId)
      if (!(game.activeSide === TeamSide.Blue && drawnEventCard === EventCardName.Embargoed)) {
        // Determine whether a team gets an asset
        await this.assetsService.checkIfAnyBidOnMarketIsWon(gameId, game.activeSide)
      }

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

      // Event Card People's Revolt effect
      if (!(drawnEventCard === EventCardName.PeoplesRevolt && game.activeSide === TeamSide.Blue)) {
        await this.playersService.addResources(
          game[nextSide].governmentPlayer.id,
          GOVERNMENT_NEW_TURN_RESOURCE_ADDITION
        )
      }

      await this.wsGateway.handleRestartTimer(game.id)
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

      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> UK Government <span id="victory-points">+5 VP</span> "Aggressive outlook"</p>'
      )
    }

    // GCHQ - Recruitment Drive
    // Check the streak and award accordingly
    const recruitmentDriveBonus = Math.max(2 * game.recruitmentDriveMaxQuartersStreak - 1, 0)
    await this.playersService.addVictoryPoints(game.blueTeam.intelligencePlayer.id, recruitmentDriveBonus)
    if (recruitmentDriveBonus > 0) {
      this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> GCHQ <span id="victory-points">+${recruitmentDriveBonus} VP</span> "Recruitment drive"</p>`
      )
    }

    // Rosenergoatom - Grow capacity
    // Check the streak and award accordingly
    const growCapacityBonus = Math.max(2 * game.growCapacityMaxQuartersStreak - 1, 0)
    await this.playersService.addVictoryPoints(game.redTeam.energyPlayer.id, growCapacityBonus)
    if (growCapacityBonus > 0) {
      this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> Rosenergoatom <span id="victory-points">+${growCapacityBonus} VP</span> "Grow capacity"</p>`
      )
    }

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
      await this.wsGateway.stopTimer(gameId)
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
        await this.addNewRecord(
          game.id,
          '<p><span id="objective">[OBJECTIVE]</span> Russian Government <span id="victory-points">-1 VP</span> "Controll the Trolls"</p>'
        )
      } else if (resourceSpent === 5 || resourceSpent === 6) {
        await this.playersService.addVictoryPoints(game.redTeam.governmentPlayer.id, -2)
        await this.addNewRecord(
          game.id,
          '<p><span id="objective">[OBJECTIVE]</span> Russian Government <span id="victory-points">-2 VP</span> "Controll the Trolls"</p>'
        )
      }
    }

    // Online Trolls objective - Success breeds confidence
    if (isOnlineTrolls && resourceSpent >= 3 && entityPlayer.hasRansomwareAttack) {
      await this.playersService.addVictoryPoints(entityPlayer.id, 4)
      await this.addNewRecord(
        game.id,
        '<p><span id="objective">[OBJECTIVE]</span> Online Trolls <span id="victory-points">+4 VP</span> "Success breeds confidence"</p>'
      )
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

      // Log successful attack action
      await this.addNewRecord(
        game.id,
        `<p><span id="action">[ACTION]</span> ${
          entityNameMap[entityPlayer.side][entityPlayer.type]
        } <span id="attack">attacks</span> ${
          entityNameMap[targetSide][targetType]
        }. <span id="resource">${resourceSpent} resource</span> is spent, dice rolls a "${diceRoll}" and attack deals <span id="attack">${damage} damage</span>.${
          entityPlayer.hasDoubleDamage ? ' Stuxnet 2.0 is applied.' : ''
        }${entityPlayer.hasRansomwareAttack ? ' Ransomware is applied.' : ''}</p>`
      )
    } else {
      damage = calculateDamage(Math.abs(attackStrength), entityPlayer.armor, entityPlayer.armorDuration)

      // Log backfired attack action
      const didBackfire = attackStrength !== 0

      const logText = didBackfire
        ? `Attack backfires and deals <span id="attack">${damage} damage</span>.`
        : `Attack deals no damage.`

      await this.addNewRecord(
        game.id,
        `<p><span id="action">[ACTION]</span> ${
          entityNameMap[entityPlayer.side][entityPlayer.type]
        } <span id="attack">attacks</span> ${
          entityNameMap[targetSide][targetType]
        }. <span id="resource">${resourceSpent} resource</span> is spent, player rolls a "${diceRoll}". ${logText}</p>`
      )
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

          this.addNewRecord(
            game.id,
            `<p>${entityNameMap[entityPlayer.side][entityPlayer.type]} attacks brings ${
              entityNameMap[targetSide][targetType]
            } to <span id="vitality">0 vitality</span>. <span id="victory-points">+10 VP</span></p>`
          )
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
          this.addNewRecord(
            game.id,
            `<p>${entityNameMap[entityPlayer.side][entityPlayer.type]} attacks brings ${
              entityNameMap[targetSide][targetType]
            } to <span id="vitality">0 vitality</span>. <span id="victory-points">+10 VP</span></p>`
          )
          break
        }
        break
      }
    }

    if (attackEndedTheGame) {
      await this.setGameOver(game.id)
      await this.wsGateway.stopTimer(game.id)
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

    // Log the bid
    const biddingPlayer = await this.playersService.getPlayerById(playerId)
    this.assetsService.getAssetById(assetId).then((asset) => {
      this.addNewRecord(
        asset.gameId,
        `<p><span id="market">[BLACK MARKET]</span> ${
          entityNameMap[biddingPlayer.side][biddingPlayer.type]
        } bids <span id="resource">${bidAmount} resource</span> on ${asset.name}</p>`
      )
    })
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

          this.addNewRecord(gameId, `<p>UK gains ${AssetName.SoftwareUpdate} asset.</p>`)
        }

        // -1 Penalty for Online Trolls
        // UK gains Education asset.
        if (playerType === PlayerType.People) {
          this.giveAssetToTeam(gameId, 'Education', TeamSide.Blue)

          this.addNewRecord(gameId, `<p>UK gains ${AssetName.Education} asset.</p>`)
        }

        // -1 Penalty for SCS
        // SCS cannot bid on Black Market for 2 turns.
        if (playerType === PlayerType.Intelligence) {
          // Add a ban to queue
          // When set to negative value, next turn turns it to its equivalent positive to mark beginning of the ban
          await this.playersService.banBidding(gameId, side, playerType, -2)

          this.addNewRecord(gameId, `<p>SCS cannot bid on Black Market for 2 turns.</p>`)
        }
      }

      // Blue Team penalties
      else {
        // -1 Penalty for GCHQ
        // GCHQ cannot launch attacks for 2 turns.
        if (playerType === PlayerType.Intelligence) {
          await this.playersService.banAttack(gameId, side, playerType, -2)

          this.addNewRecord(gameId, `<p>GCHQ cannot launch attacks for 2 turns.</p>`)
        }

        // -1 Penalty for UK Government
        // Russia gains Bargaining Chip asset.
        if (playerType === PlayerType.Government) {
          this.giveAssetToTeam(gameId, 'Bargaining Chip', TeamSide.Red)

          this.addNewRecord(gameId, `<p>Russia gains Bargaining Chip asset.</p>`)
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

          this.addNewRecord(gameId, `<p>UK gains Software Update and Recovery Management assets.</p>`)
        }

        // -2 Penalty for Online Trolls
        // UK gains Education asset, Online Trolls cannot launch attacks for 2 turns.
        if (playerType === PlayerType.People) {
          this.giveAssetToTeam(gameId, 'Education', TeamSide.Blue)
          await this.playersService.banAttack(gameId, side, playerType, -2)

          this.addNewRecord(gameId, `<p>UK gains Education asset, Online Trolls cannot launch attacks for 2 turns.</p>`)
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

          this.addNewRecord(gameId, `<p>UK may choose to open up an attack vector at no cost.</p>`)
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

          this.addNewRecord(
            gameId,
            `<p>GCHQ cannot perform any actions for 2 turns, UK Government loses <span id="vitality">1 vitality</span>.</p>`
          )
        }

        // -2 Penalty for UK Government
        // Russia gains Bargaining Chip asset, UK Government lose additional 2 Vitality and 2 Resource.
        if (playerType === PlayerType.Government) {
          this.giveAssetToTeam(gameId, 'Bargaining Chip', TeamSide.Red)

          const game = await this.getGameById(gameId)
          await this.playersService.reducePlayerVitality(game.blueTeam.governmentPlayer.id, 2)
          await this.playersService.reducePlayerResource(game.blueTeam.governmentPlayer.id, 2)

          this.addNewRecord(
            gameId,
            `<p>Russia gains Bargaining Chip asset, UK Government loses additional <span id="vitality">2 vitality</span> and <span id="resource">2 resource</span>.</p>`
          )
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
      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> UK Government <span id="victory-points">+1 VP</span> "Election time"</p>'
      )
    }

    // UK PLC - Weather the Brexit storm
    if (activePeriod === GamePeriod.April && game.blueTeam.industryPlayer.resource >= 3) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 2)
      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> UK PLC <span id="victory-points">+2 VP</span> "Weather the Brexit storm"</p>'
      )
    } else if (activePeriod === GamePeriod.August && game.blueTeam.industryPlayer.resource >= 6) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 3)
      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> UK PLC <span id="victory-points">+3 VP</span> "Weather the Brexit storm"</p>'
      )
    } else if (activePeriod === GamePeriod.December && game.blueTeam.industryPlayer.resource >= 9) {
      await this.playersService.addVictoryPoints(game.blueTeam.industryPlayer.id, 4)
      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> UK PLC <span id="victory-points">+4 VP</span> "Weather the Brexit storm"</p>'
      )
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
      this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> UK Energy <span id="victory-points">+2 VP</span> "Grow capacity"</p>`
      )
    }
    if (activePeriod === GamePeriod.December && game.blueTeam.energyPlayer.vitality >= 9) {
      await this.playersService.addVictoryPoints(game.blueTeam.energyPlayer.id, 3)
      this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> UK Energy <span id="victory-points">+3 VP</span> "Grow capacity"</p>`
      )
    }

    // Russian Government - Some animals are more equal than others
    if (game.redTeam.governmentPlayer.resource >= 3) {
      await this.playersService.addVictoryPoints(game.redTeam.governmentPlayer.id, 1)

      await this.addNewRecord(
        gameId,
        '<p><span id="objective">[OBJECTIVE]</span> Russian Government <span id="victory-points">+1 VP</span> "Some animals are more equal than others"</p>'
      )
    }

    // Energetic Bear = Those who can't, steal
    if (activePeriod === GamePeriod.April) {
      if (game.redTeam.industryPlayer.vitality > INITIAL_VITALITY) {
        await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 1)
        await this.addNewRecord(
          gameId,
          `<p><span id="objective">[OBJECTIVE]</span> Energetic Bear <span id="victory-points">+1 VP</span> "Those who can't, steal"</p>`
        )
      }
      await this.gamesRepository.setEnergeticBearAprilVitality(game.id, Number(game.redTeam.industryPlayer.vitality))
    }
    if (activePeriod === GamePeriod.August) {
      if (game.redTeam.industryPlayer.vitality > Number(game.energeticBearAprilVitality)) {
        await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 3)
        await this.addNewRecord(
          gameId,
          `<p><span id="objective">[OBJECTIVE]</span> Energetic Bear <span id="victory-points">+3 VP</span> "Those who can't, steal"</p>`
        )
      }
      await this.gamesRepository.setEnergeticBearAugustVitality(game.id, Number(game.redTeam.industryPlayer.vitality))
    }
    if (
      activePeriod === GamePeriod.December &&
      game.redTeam.industryPlayer.vitality > Number(game.energeticBearAugustVitality)
    ) {
      await this.playersService.addVictoryPoints(game.redTeam.industryPlayer.id, 5)
      await this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> Energetic Bear <span id="victory-points">+5 VP</span> "Those who can't, steal"</p>`
      )
    }

    // SCS - Win the arms race
    if (await this.assetsService.hasRussiaMoreAttackAssetsThanUKDefenceAssets(gameId)) {
      await this.playersService.addVictoryPoints(game.redTeam.intelligencePlayer.id, 2)
      await this.addNewRecord(
        gameId,
        `<p><span id="objective">[OBJECTIVE]</span> SCS <span id="victory-points">+2 VP</span> "Win the arms race"</p>`
      )
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

        this.addNewRecord(
          gameId,
          `<p><span id="asset">[ASSET]</span> UK opens up an attack vector on Russian Government</p>`
        )
        break

      case PlayerType.Energy:
        if (teamSide === TeamSide.Blue) {
          this.gamesRepository.save({
            id: gameId,
            isRosenergoatomAttacked: true,
          })
          this.addNewRecord(
            gameId,
            `<p><span id="asset">[ASSET]</span> GCHQ opens up an attack vector on Rosenergoatom</p>`
          )
        } else {
          this.gamesRepository.save({
            id: gameId,
            isUkEnergyAttacked: true,
          })
          this.addNewRecord(gameId, `<p><span id="asset">[ASSET]</span> SCS opens up an attack vector on UK Energy</p>`)
        }
        break

      default:
        break
    }
  }

  // Electorate suffers half of any damage for 3 turns
  async activateEducation(gameId: string, assetId: string): Promise<void> {
    const { blueTeam } = await this.gamesRepository.getGameById(gameId)
    await this.playersService.activateArmor(blueTeam.peoplePlayer.id, 50, 3)

    // Log activation
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    this.addNewRecord(gameId, `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Education asset</p>`)
  }

  // Russia Government suffers half of any damage for 3 turns
  async activateBargainingChip(gameId: string, assetId: string): Promise<void> {
    const { redTeam } = await this.gamesRepository.getGameById(gameId)
    await this.playersService.activateArmor(redTeam.governmentPlayer.id, 50, 3)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Bargaining Chip asset</p>`
    )
  }

  // If UK PLC suffered any damage this turn, increase vitality by 1
  async activateRecoveryManagement(gameId: string, assetId: string): Promise<void> {
    await this.gamesRepository.save({ id: gameId, isRecoveryManagementActive: true })

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Recovery Management asset</p>`
    )
  }

  // Renders an entity immune to direct attacks for 2 turns
  async activateSoftwareUpdate(gameId: string, playerId: string, assetId: string): Promise<void> {
    await this.playersService.activateDamageImmunity(playerId, 2)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    const immunePlayer = await this.playersService.getPlayerById(playerId)
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Software Update asset. ${
        entityNameMap[immunePlayer.side][immunePlayer.type]
      } is now immune to direct attacks for 2 turns.</p>`
    )
  }

  // Renders Entity immune for splash damage, but only 2 resource can be transferred to or from it each turn
  async activateNetworkPolicy(gameId: string, assetId: string, playerId: string): Promise<void> {
    await this.playersService.activateSplashImmunity(playerId)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    const immunePlayer = await this.playersService.getPlayerById(playerId)
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Network Policy asset. ${
        entityNameMap[immunePlayer.side][immunePlayer.type]
      } is now immune to splash damage, but only <span id="resource">2 resource</span> can be transferred to or from it each turn.</p>`
    )
  }

  // Direct attack from intelligence players deal double damage to energy players
  async activateStuxnet(gameId: string, assetId: string, playerId: string): Promise<void> {
    await this.playersService.activateDoubleDamage(playerId)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    const immunePlayer = await this.playersService.getPlayerById(playerId)
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Stuxnet 2.0 asset. Next direct attack from ${
        entityNameMap[immunePlayer.side][immunePlayer.type]
      } deals double damage</p>`
    )
  }

  // Entity can revitalise at 1 less resource cost
  async activateCyberInvestmentProgramme(gameId: string, assetId: string, playerId: string): Promise<void> {
    await this.playersService.activateCyberInvestmentProgramme(playerId)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    const immunePlayer = await this.playersService.getPlayerById(playerId)
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Cyber Investment Programme asset. ${
        entityNameMap[immunePlayer.side][immunePlayer.type]
      } now regenerates <span id="vitality">Vitality</span> at 1 less <span id="resource">Resource</span> cost than normal.</p>`
    )
  }

  // Ransomware
  async activateRansomware(gameId: string, assetId: string, playerId: string): Promise<void> {
    await this.playersService.activateRansomware(playerId)

    // Log
    const asset = await this.assetsService.getAssetById(assetId)
    const activatingSide = asset.blueTeamBid > asset.redTeamBid ? 'UK' : 'Russia'
    const immunePlayer = await this.playersService.getPlayerById(playerId)
    await this.addNewRecord(
      gameId,
      `<p><span id="asset">[ASSET]</span> ${activatingSide} activates Ransomware asset. Next successful direct attack from ${
        entityNameMap[immunePlayer.side][immunePlayer.type]
      } infects the target with ransomware</p>`
    )
  }

  async setAssetActivated(assetId: string): Promise<void> {
    await this.assetsService.setAssetStatus(assetId, AssetStatus.Activated)
  }

  async payRansomwareAttacker(gameId: string, attackerId: string, victimId: string, yes: boolean): Promise<void> {
    const victim = await this.playersService.getPlayerById(victimId)
    const attacker = await this.playersService.getPlayerById(attackerId)

    let log = `${entityNameMap[victim.side][victim.type]}`

    if (yes) {
      // Pay 2 resource
      await this.playersService.sendResources(victimId, attackerId, 2)

      // Unparalyze
      await this.playersService.unparalyze(victimId)

      log += ` pays <span id="resource">2 resource</span> to ${
        entityNameMap[attacker.side][attacker.type]
      } and is no longer paralyzed.`
    }
    // Else, keep resource and stay paralyzed
    else {
      log += ` refuses to pay <span id="resource">2 resource</span> to ${
        entityNameMap[attacker.side][attacker.type]
      } and stays paralyzed for 2 turns.`
    }

    // Reset flag
    await this.playersService.setWasRansomwareAttacked(victimId, false)

    await this.addNewRecord(gameId, `<p><span id="ransomware">[RANSOMWARE]</span> ${log}</p>`)
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
        await this.playersService.banBidding(gameId, TeamSide.Red, PlayerType.Intelligence, 1)
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

  async addNewRecord(gameId: string, record: string): Promise<void> {
    await this.gamesRepository.addRecord(gameId, record)
    await this.wsGateway.handleRecordLog(gameId, record)
  }
}
