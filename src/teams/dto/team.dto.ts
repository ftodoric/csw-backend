import { IsEnum, IsString } from 'class-validator';
import { TeamSide } from '../team-side.enum';

export class TeamDto {
  @IsEnum(TeamSide)
  side: TeamSide;

  @IsString()
  name: string;

  @IsString()
  peoplePlayerId: string;

  @IsString()
  industryPlayerId: string;

  @IsString()
  governmentPlayerId: string;

  @IsString()
  energyPlayerId: string;

  @IsString()
  intelligencePlayerId: string;
}
