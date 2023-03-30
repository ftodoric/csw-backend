import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { UserRepository } from 'src/auth/user.repository';
import { TeamSide } from 'src/teams/team-side.enum';
import { TeamsRepository } from 'src/teams/teams.repository';
import { CreateGameDto } from './dto/create-game.dto';
import { GameStatus } from './game-status.enum';
import { Game } from './game.entity';
import { GamesRepository } from './games.repository';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository,
    @InjectRepository(TeamsRepository) private teamsRepository: TeamsRepository,
    @InjectRepository(UserRepository) private userRepository: UserRepository,
  ) {}

  async createGame(gameDto: CreateGameDto, user: User): Promise<void> {
    const electoratePlayer = await this.userRepository.findOneBy({
      username: gameDto.electoratePlayer,
    });
    const ukPlcPlayer = await this.userRepository.findOneBy({
      username: gameDto.ukPlcPlayer,
    });
    const ukGovernmentPlayer = await this.userRepository.findOneBy({
      username: gameDto.ukGovernmentPlayer,
    });
    const ukEnergyPlayer = await this.userRepository.findOneBy({
      username: gameDto.ukEnergyPlayer,
    });
    const gchqPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const onlineTrollsPlayer = await this.userRepository.findOneBy({
      username: gameDto.onlineTrollsPlayer,
    });
    const energeticBearPlayer = await this.userRepository.findOneBy({
      username: gameDto.energeticBearPlayer,
    });
    const russianGovernmentPlayer = await this.userRepository.findOneBy({
      username: gameDto.russianGovernmentPlayer,
    });
    const rosenergoatomPlayer = await this.userRepository.findOneBy({
      username: gameDto.rosenergoatomPlayer,
    });
    const scsPlayer = await this.userRepository.findOneBy({
      username: gameDto.scsPlayer,
    });

    // Create two teams and assign players to each team entity
    const blueTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Blue,
      name: gameDto.blueTeamName,
      peoplePlayerId: electoratePlayer.id,
      industryPlayerId: ukPlcPlayer.id,
      governmentPlayerId: ukGovernmentPlayer.id,
      energyPlayerId: ukEnergyPlayer.id,
      intelligencePlayerId: gchqPlayer.id,
    });

    const redTeam = await this.teamsRepository.createTeam({
      side: TeamSide.Red,
      name: gameDto.redTeamName,
      peoplePlayerId: onlineTrollsPlayer.id,
      industryPlayerId: energeticBearPlayer.id,
      governmentPlayerId: russianGovernmentPlayer.id,
      energyPlayerId: rosenergoatomPlayer.id,
      intelligencePlayerId: scsPlayer.id,
    });

    // Create a game with both sides
    await this.gamesRepository.createGame({
      ownerId: user.id,
      blueTeam: blueTeam,
      redTeam: redTeam,
      status: GameStatus.NotStarted,
      description: gameDto.description,
    });
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user);
  }
}
