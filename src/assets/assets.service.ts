import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { GamesService } from '@games'
import { TeamSide } from '@teams/interface'

import { AssetsRepository } from './assets.repository'
import { AssetDto } from './dto'
import { Asset } from './entities'
import { AssetStatus } from './interface'

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(AssetsRepository) private assetsRepository: AssetsRepository,
    @Inject(forwardRef(() => GamesService)) private gamesService: GamesService
  ) {}

  async createAsset(assetDto: AssetDto, gameId: string): Promise<string> {
    return await this.assetsRepository.createAsset(assetDto, gameId)
  }

  async getAssetById(id: string): Promise<Asset> {
    return await this.assetsRepository.findOneBy({ id })
  }

  async getBlackMarketAssets(gameId: string): Promise<Asset[]> {
    return await this.assetsRepository.getBlackMarketAssets(gameId)
  }

  async getTeamAssets(gameId: string, teamSide: TeamSide): Promise<Asset[]> {
    return await this.assetsRepository.getTeamAssets(gameId, teamSide)
  }

  async getNotBidOnAssets(gameId: string): Promise<Asset[]> {
    return await this.assetsRepository.getNotBidOnAssets(gameId)
  }

  async getBidOnAssets(gameId: string): Promise<Asset[]> {
    return await this.assetsRepository.getBidOnAssets(gameId)
  }

  async makeBid(id: string, side: TeamSide, bidAmount: number): Promise<void> {
    const teamBidKey = `${[side]}Bid`

    const asset = await this.assetsRepository.findOneBy({ id })

    await this.assetsRepository.save({
      id,
      [teamBidKey]: bidAmount,
      // This increments on every turn for assets that are bid on
      // Only the first time must this be set to 1 to start the count
      turnsFromFirstBid: asset.turnsFromFirstBid === 0 ? 1 : asset.turnsFromFirstBid,
      lastBidSide: side,
    })
  }

  async checkIfAnyBidOnMarketIsWon(gameId: string, previousSide: TeamSide): Promise<void> {
    const assets = await this.assetsRepository.getBlackMarketAssets(gameId)

    assets.forEach(async (asset) => {
      // Increment turns from first bid
      if (asset.turnsFromFirstBid >= 1) {
        await this.assetsRepository.save({ id: asset.id, turnsFromFirstBid: asset.turnsFromFirstBid + 1 })
      }

      if (asset.turnsFromFirstBid > 1 && asset.lastBidSide !== previousSide) {
        // Award the asset to the team that's on the next turn
        await this.assetsRepository.save({ id: asset.id, status: AssetStatus.Secured })

        // Log an auction win
        this.gamesService.addNewRecord(
          asset.gameId,
          `<p><span id="market">[BLACK MARKET]</span> ${
            asset.blueTeamBid > asset.redTeamBid ? 'GCHQ' : 'SCS'
          } secures ${asset.name} asset for its team as a highest bidder</p>`
        )
      }
    })
  }

  async supplyAssetToMarket(gameId: string): Promise<void> {
    const assets = await this.assetsRepository.getUnsuppliedAssets(gameId)

    const min = 0
    const max = assets.length
    const random = Math.floor(Math.random() * (max - min) + min)

    assets.forEach((asset, i) => {
      // Suply random asset
      if (i === random) {
        this.assetsRepository.save({
          id: asset.id,
          status: AssetStatus.Bidding,
        })
      }
    })
  }

  async giveAssetToTeam(assetId: string, side: TeamSide) {
    const blueTeamBid = side === TeamSide.Blue ? 1 : 0
    const redTeamBid = side === TeamSide.Red ? 1 : 0

    await this.assetsRepository.save({
      id: assetId,
      status: AssetStatus.Secured,
      blueTeamBid,
      redTeamBid,
    })
  }

  async hasRussiaMoreAttackAssetsThanUKDefenceAssets(gameId: string): Promise<boolean> {
    const ukDefenceAssetsCount = await this.assetsRepository.getUkDefenceAssetsCount(gameId)
    const russiaAttackAssetsCount = await this.assetsRepository.getRussiaAttackAssetsCount(gameId)

    return russiaAttackAssetsCount > ukDefenceAssetsCount
  }

  async setAssetStatus(assetId: string, status: AssetStatus): Promise<void> {
    await this.assetsRepository.save({
      id: assetId,
      status,
    })
  }
}
