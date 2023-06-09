import { EventCardName } from '@event-cards/interface'
import { GameStatus, GameOutcome, GamePeriod } from '@games/interface/game.types'
import { Team } from '@teams/entities'
import { TeamSide } from '@teams/interface'

export interface GameDto {
  ownerId: string
  blueTeam: Team
  redTeam: Team
  status: GameStatus
  description?: string
  outcome?: GameOutcome
  turnsRemainingTime: number
  activeSide: TeamSide
  activePeriod: GamePeriod
  drawnEventCard: EventCardName
  // In seconds
  timeLimit: number
}
