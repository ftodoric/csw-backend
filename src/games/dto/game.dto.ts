import { IsString, MinLength } from 'class-validator';

export class GameDto {
  @IsString()
  @MinLength(1)
  name: string;
}
