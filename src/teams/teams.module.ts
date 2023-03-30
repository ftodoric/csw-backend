import { Module } from '@nestjs/common'

import { TeamsController } from './teams.controller'
import { TeamsService } from './teams.service'

@Module({
  providers: [TeamsService],
  controllers: [TeamsController],
})
export class TeamsModule {}
