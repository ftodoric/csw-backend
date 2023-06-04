import { Player } from '@players/entities'
import { PlayerType } from '@players/interface'
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

export interface AssetActivationPayload {
  teamSide: TeamSide
  attackVectorTarget?: PlayerType
}

export enum GameEntity {
  // Blue Team
  UKGovernment = 'ukGovernment',
  Electorate = 'electorate',
  UKPLC = 'ukPlc',
  UKEnergy = 'ukEnergy',
  GCHQ = 'gchq',

  // Red Team
  RussianGovernment = 'russianGovernment',
  OnlineTrolls = 'onlineTrolls',
  EnergeticBear = 'energeticBear',
  Rosenergoatom = 'rosenergoatom',
  SCS = 'scs',
}
