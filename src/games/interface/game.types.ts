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
  // Distribute
  resourceAmount?: number
  targetPlayerId?: string

  // Revitalise
  revitalizationAmount?: number
}

export interface FinishTurnPayload {
  [playerId: string]: {
    entityPlayer: Player
    gameAction: GameAction
    gameActionPayload: GameActionPayload
  }
}

export interface BidPayload {
  teamSide: TeamSide
  bid: number
  entityPlayer: Player
}

export interface AssetActivationPayload {
  teamSide: TeamSide
  attackVectorTarget?: PlayerType
  softwareUpdateTarget?: PlayerType
  networkPolicyTarget?: PlayerType
  cyberInvestmentProgrammeTarget?: PlayerType
  ransomwareAttacker?: PlayerType
}

export interface RansomwarePaymentPayload {
  attackerId: string
  victimId: string
}
export enum RansomwarePaymentAnswer {
  Yes = 'yes',
  No = 'no',
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
