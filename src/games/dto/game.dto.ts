import { GameStatus, Outcome, Period } from '@games/interface'
import { PlayerType } from '@players/interface'
import { Team } from '@teams/entities'
import { TeamSide } from '@teams/interface'

export interface GameDto {
  ownerId: string
  blueTeam: Team
  redTeam: Team
  status: GameStatus
  description?: string
  outcome?: Outcome
  turnsRemainingTime: number
  paused: boolean
  activeSide: TeamSide
  activePlayer: PlayerType
  activePeriod: Period
}
