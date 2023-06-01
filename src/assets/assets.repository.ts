import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { TeamSide } from '@teams/interface'
import { DataSource, Repository } from 'typeorm'

import { AssetDto } from './dto'
import { Asset } from './entities'
import { AssetStatus } from './interface'

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
      turnsFromFirstBid: 0,
      lastBidSide: TeamSide.Red,
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

  async getBlackMarketAssets(gameId: string): Promise<Asset[]> {
    const query = this.createQueryBuilder('asset')
      .where('asset.gameId = :gameId', { gameId })
      .andWhere('asset.status = :status', { status: AssetStatus.Bidding })

    return query.getMany()
  }

  async getUnsuppliedAssets(gameId: string): Promise<Asset[]> {
    const query = this.createQueryBuilder('asset')
      .where('asset.gameId = :gameId', { gameId })
      .andWhere('asset.status = :status', { status: AssetStatus.NotSuppliedToMarket })

    return query.getMany()
  }

  async getTeamAssets(gameId: string, teamSide: TeamSide): Promise<Asset[]> {
    const opponentSide = teamSide === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue
    const bidWhereClause = `asset.${teamSide}Bid > asset.${opponentSide}Bid`

    const query = this.createQueryBuilder('asset')
      .where('asset.gameId = :gameId', { gameId })

      // If asset is secured and outbidded, it belongs to a team
      .andWhere('asset.status = :status', { status: AssetStatus.Secured })
      .andWhere(bidWhereClause)

    return query.getMany()
  }
}
