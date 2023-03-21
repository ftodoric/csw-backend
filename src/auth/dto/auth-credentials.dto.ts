import { IsString, MinLength, MaxLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(3, { message: 'Too short' })
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(3)
  @MaxLength(32)
  password: string;
}
