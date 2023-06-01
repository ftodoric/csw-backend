import { Player } from '@players/entities'
import { TeamSide } from '@teams/interface'

export enum GameStatus {
  NotStarted = 'notStarted',
  Paused = 'paused',
  InProgress = 'inProgress',
  Finished = 'finished',
}

export enum GamePeriod {
  January,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December,
}

export enum GameOutcome {
  BlueVictory,
  RedVictory,
  Tie,
}

export enum GameAction {
  DISTRIBUTE = 'distribute',
  REVITALISE = 'revitalise',
  ATTACK = 'attack',
  ABSTAIN = 'abstain',
  ACCESS_BLACK_MARKET = 'accessBlackMarket',
}

export interface GameActionPayload {
  entityPlayer: Player

  // Distribute
  resourceAmount?: number
  targetPlayerId?: string

  // Revitalise
  revitalizationAmount?: number

  // Attack
  diceRoll?: number
}

export interface BidPayload {
  teamSide: TeamSide
  bid: number
  entityPlayer: Player
}
