import { User } from '@auth/user.entity'
import { IsEnum, IsObject, IsString } from 'class-validator'

import { TeamSide } from '../team-side.enum'

export class TeamDto {
  @IsEnum(TeamSide)
  side: TeamSide

  @IsString()
  name: string

  @IsObject()
  peoplePlayer: User

  @IsObject()
  industryPlayer: User

  @IsObject()
  governmentPlayer: User

  @IsObject()
  energyPlayer: User

  @IsObject()
  intelligencePlayer: User
}
