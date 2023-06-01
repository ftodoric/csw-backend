import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AssetsRepository } from './assets.repository'
import { AssetsService } from './assets.service'
import { Asset } from './entities'

@Module({
  providers: [AssetsService, AssetsRepository],
  imports: [TypeOrmModule.forFeature([Asset])],
  exports: [AssetsService],
})
export class AssetsModule {}
