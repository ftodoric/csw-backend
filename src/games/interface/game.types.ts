import { Player } from '@players/entities'

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
  BlueWins,
  RedWins,
  Tie,
}

export enum GameAction {
  DISTRIBUTE = 'distribute',
  REVITALISE = 'revitalise',
  ATTACK = 'attack',
  ABSTAIN = 'abstain',
}

export interface GameActionPayload {
  entityPlayer: Player
}
