import { Module } from '@nestjs/common'

import { AuthModule } from '@auth'
import { GamesModule } from '@games'

import { SeedService } from './seed.service'

@Module({
  providers: [SeedService],
  imports: [AuthModule, GamesModule],
})
export class SeedModule {}
