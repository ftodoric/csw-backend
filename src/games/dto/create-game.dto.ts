import { IsOptional, IsString, MinLength } from 'class-validator';

const teamNameRequirement = 'Team name is required.';
const playerEntityAssignmentRequirement =
  'A player must be assigned to every Entity.';

export class CreateGameDto {
  // Blue Team
  @IsString()
  @MinLength(1, { message: teamNameRequirement })
  blueTeamName: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  electoratePlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukPlcPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukGovernmentPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukEnergyPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  gchqPlayer: string;

  // Red Team
  @IsString()
  @MinLength(1, { message: teamNameRequirement })
  redTeamName: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  onlineTrollsPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  energeticBearPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  russianGovernmentPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  rosenergoatomPlayer: string;

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  scsPlayer: string;

  // Description
  @IsString()
  @IsOptional()
  description: string;
}
