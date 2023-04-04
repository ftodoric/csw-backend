import { IsString, MinLength, MaxLength } from 'class-validator'

export class AuthCredentialsDto {
  @IsString()
  @MinLength(2, { message: 'Username must contain at least 2 characters.' })
  @MaxLength(20)
  username: string

  @IsString()
  @MinLength(2, { message: 'Password must contain at least 2 characters.' })
  @MaxLength(32)
  password: string
}
