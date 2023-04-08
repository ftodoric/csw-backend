import { Team } from 'src/teams/team.entity'

import { GameStatus } from '../game-status.enum'

export interface GameDto {
  ownerId: string
  blueTeam: Team
  redTeam: Team
  status: GameStatus
  description?: string
  winner?: Team
}
