import { Player } from '@players/entities'
import { TeamSide } from '@teams/interface'
import { IsEnum, IsObject, IsString } from 'class-validator'

export class TeamDto {
  @IsEnum(TeamSide)
  side: TeamSide

  @IsString()
  name: string

  @IsObject()
  peoplePlayer: Player

  @IsObject()
  industryPlayer: Player

  @IsObject()
  governmentPlayer: Player

  @IsObject()
  energyPlayer: Player

  @IsObject()
  intelligencePlayer: Player
}
