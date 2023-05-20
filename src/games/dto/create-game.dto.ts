import { IsOptional, IsString, MinLength } from 'class-validator'

const teamNameRequirement = 'Team name is required.'
const playerEntityAssignmentRequirement = 'A player must be assigned to every Entity.'

export class CreateGameDto {
  // Blue Team
  @IsString()
  @MinLength(1, { message: teamNameRequirement })
  blueTeamName: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  electorateUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukPlcUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukGovernmentUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  ukEnergyUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  gchqUserId: string

  // Red Team
  @IsString()
  @MinLength(1, { message: teamNameRequirement })
  redTeamName: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  onlineTrollsUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  energeticBearUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  russianGovernmentUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  rosenergoatomUserId: string

  @IsString()
  @MinLength(1, { message: playerEntityAssignmentRequirement })
  scsUserId: string

  // Description
  @IsString()
  @IsOptional()
  description: string
}
