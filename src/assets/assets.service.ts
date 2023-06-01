import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AssetsRepository } from './assets.repository'
import { AssetDto } from './dto'

@Injectable()
export class AssetsService {
  constructor(@InjectRepository(AssetsRepository) private assetsRepository: AssetsRepository) {}

  async createAsset(assetDto: AssetDto, gameId: string): Promise<string> {
    return await this.assetsRepository.createAsset(assetDto, gameId)
  }
}
