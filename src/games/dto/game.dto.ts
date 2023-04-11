import { GameStatus } from '@games/interface'
import { Team } from '@teams/entities'

export interface GameDto {
  ownerId: string
  blueTeam: Team
  redTeam: Team
  status: GameStatus
  description?: string
  winner?: Team
}
