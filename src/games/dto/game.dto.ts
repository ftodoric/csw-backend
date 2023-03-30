import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { Team } from 'src/teams/team.entity'

import { GameStatus } from '../game-status.enum'

export class GameDto {
  @IsString()
  ownerId: string

  @IsObject()
  blueTeam: Team

  @IsObject()
  redTeam: Team

  @IsEnum(GameStatus)
  status: GameStatus

  @IsString()
  @IsOptional()
  description: string
}
