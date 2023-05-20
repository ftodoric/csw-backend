import { User } from '@auth/entities'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'

export interface CreatePlayerDto {
  user: User
  side: TeamSide
  playerType: PlayerType
}
