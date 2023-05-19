import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common'

import { AuthService } from '@auth'
import { User } from '@auth/entities'
import { GamesService } from '@games'

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(GamesService) private gamesService: GamesService
  ) {}

  async onApplicationBootstrap() {
    if (await this.isDatabaseEmpty()) {
      const blueUserId = await this.authService.signUp({
        username: 'Physx',
        password: 'hesoyam',
      })

      const redUserId = await this.authService.signUp({
        username: 'Azurrox',
        password: 'hesoyam',
      })

      const owner = await this.authService.getUserById(blueUserId)

      await this.seedAGame(blueUserId, redUserId, owner)
    }
  }

  private seedAGame(blueUserId: string, redUserId: string, owner: User): Promise<string> {
    return this.gamesService.createGame(
      {
        blueTeamName: 'Autobots',
        electoratePlayer: blueUserId,
        ukPlcPlayer: blueUserId,
        ukGovernmentPlayer: blueUserId,
        ukEnergyPlayer: blueUserId,
        gchqPlayer: blueUserId,
        redTeamName: 'Decepticons',
        onlineTrollsPlayer: redUserId,
        energeticBearPlayer: redUserId,
        russianGovernmentPlayer: redUserId,
        rosenergoatomPlayer: redUserId,
        scsPlayer: redUserId,
        description: 'This is War for Cybertron.',
      },
      owner
    )
  }

  private async isDatabaseEmpty() {
    const users = await this.authService.getAllusers()
    return users.length === 0
  }
}
