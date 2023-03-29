import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { UserRepository } from 'src/auth/user.repository';
import { SideEnum } from 'src/teams/team.interface';
import { TeamsRepository } from 'src/teams/teams.repository';
import { CreateGameDto } from './dto/create-game.dto';
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
    const blueGovPlayer = await this.userRepository.findOneBy({
      username: gameDto.blueGovernmentPlayer,
    });
    const ukPlcPlayer = await this.userRepository.findOneBy({
      username: gameDto.ukPlcPlayer,
    });
    const electoratePlayer = await this.userRepository.findOneBy({
      username: gameDto.electoratePlayer,
    });
    const gchqPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const ukEnergyPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const redGovernmentPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const energeticBearPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const onlineTrollsPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const scsPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });
    const rosenergoatomPlayer = await this.userRepository.findOneBy({
      username: gameDto.gchqPlayer,
    });

    // Create two teams and assign players
    const blueTeam = await this.teamsRepository.createTeam({
      name: gameDto.blueTeamName,
      side: SideEnum.Blue,
      govPlayerId: blueGovPlayer.id,
      busPlayerId: ukPlcPlayer.id,
      popPlayerId: electoratePlayer.id,
      milPlayerId: gchqPlayer.id,
      enePlayerId: ukEnergyPlayer.id,
    });

    const redTeam = await this.teamsRepository.createTeam({
      name: gameDto.redTeamName,
      side: SideEnum.Red,
      govPlayerId: redGovernmentPlayer.id,
      busPlayerId: energeticBearPlayer.id,
      popPlayerId: onlineTrollsPlayer.id,
      milPlayerId: scsPlayer.id,
      enePlayerId: rosenergoatomPlayer.id,
    });
    // Create a game with ids of the blue and red team

    await this.gamesRepository.createGame({
      ownerId: user.id,
      description: gameDto.description,
      status: 'IN_PROGRESS',
      blueTeam: blueTeam,
      redTeam: redTeam,
    });
  }

  async getGames(user: User): Promise<Game[]> {
    return this.gamesRepository.getGames(user);
  }
}
