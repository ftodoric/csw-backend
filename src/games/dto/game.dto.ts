import { IsOptional, IsString, MinLength } from 'class-validator';
import { Team } from 'src/teams/team.entity';

export class GameDto {
  @IsString()
  ownerId: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @MinLength(1)
  blueTeam: Team;

  @IsString()
  @MinLength(1)
  redTeam: Team;
}
