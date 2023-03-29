import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @MinLength(1)
  blueTeamName: string;

  @IsString()
  @MinLength(1)
  blueGovernmentPlayer: string;

  @IsString()
  @MinLength(1)
  ukPlcPlayer: string;

  @IsString()
  @MinLength(1)
  electoratePlayer: string;

  @IsString()
  @MinLength(1)
  gchqPlayer: string;

  @IsString()
  @MinLength(1)
  ukEnergyPlayer: string;

  @IsString()
  @MinLength(1)
  redTeamName: string;

  @IsString()
  @MinLength(1)
  redGovernmentPlayer: string;

  @IsString()
  @MinLength(1)
  energeticBearPlayer: string;

  @IsString()
  @MinLength(1)
  onlineTrollsPlayer: string;

  @IsString()
  @MinLength(1)
  scsPlayer: string;

  @IsString()
  @MinLength(1)
  rosenergoatomPlayer: string;

  @IsString()
  @IsOptional()
  description: string;
}
