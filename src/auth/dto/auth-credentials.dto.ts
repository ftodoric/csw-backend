import { IsString, MinLength, MaxLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(1, { message: 'Username is required.' })
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  @MaxLength(32)
  password: string;
}
