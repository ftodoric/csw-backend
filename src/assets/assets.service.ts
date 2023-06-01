import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { TeamSide } from '@teams/interface'

import { AssetsRepository } from './assets.repository'
import { AssetDto } from './dto'
import { Asset } from './entities'

@Injectable()
export class AssetsService {
  constructor(@InjectRepository(AssetsRepository) private assetsRepository: AssetsRepository) {}

  async createAsset(assetDto: AssetDto, gameId: string): Promise<string> {
    return await this.assetsRepository.createAsset(assetDto, gameId)
  }

  async getBlackMarketAssets(gameId: string): Promise<Asset[]> {
    return await this.assetsRepository.getBlackMarketAssets(gameId)
  }

  async getTeamAssets(gameId: string, teamSide: TeamSide): Promise<Asset[]> {
    return await this.assetsRepository.getTeamAssets(gameId, teamSide)
  }
}
