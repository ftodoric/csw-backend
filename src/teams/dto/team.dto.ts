import { IsString, MinLength } from 'class-validator';
import { SideEnum } from '../team.interface';

export class TeamDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  side: SideEnum;

  @IsString()
  govPlayerId: string;

  @IsString()
  busPlayerId: string;

  @IsString()
  popPlayerId: string;

  @IsString()
  milPlayerId: string;

  @IsString()
  enePlayerId: string;
}
