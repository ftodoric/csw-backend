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
        // Blue team
        blueTeamName: 'Autobots',
        electorateUserId: blueUserId,
        ukPlcUserId: blueUserId,
        ukGovernmentUserId: blueUserId,
        ukEnergyUserId: blueUserId,
        gchqUserId: blueUserId,

        // Red team
        redTeamName: 'Decepticons',
        onlineTrollsUserId: redUserId,
        energeticBearUserId: redUserId,
        russianGovernmentUserId: redUserId,
        rosenergoatomUserId: redUserId,
        scsUserId: redUserId,
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
