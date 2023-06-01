import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { DataSource, Repository } from 'typeorm'

import { AssetDto } from './dto'
import { Asset } from './entities'

@Injectable()
export class AssetsRepository extends Repository<Asset> {
  constructor(dataSource: DataSource) {
    super(Asset, dataSource.createEntityManager())
  }

  async createAsset(createAssetDto: AssetDto, gameId: string): Promise<string> {
    const asset = await this.create({
      ...createAssetDto,
      blueTeamBid: 0,
      redTeamBid: 0,
      gameId: gameId,
    })

    try {
      await this.save(asset)
    } catch (error) {
      // Duplicate asset
      if (error.code === '23505') throw new ConflictException(`Asset with ID ${asset.id} already exists.`)
      else throw new InternalServerErrorException('Asset creation failed.')
    }

    return asset.id
  }
}
