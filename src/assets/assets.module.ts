import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GamesModule } from '@games'

import { AssetsRepository } from './assets.repository'
import { AssetsService } from './assets.service'
import { Asset } from './entities'

@Module({
  providers: [AssetsService, AssetsRepository],
  imports: [TypeOrmModule.forFeature([Asset]), forwardRef(() => GamesModule)],
  exports: [AssetsService],
})
export class AssetsModule {}
