import { AssetStatus, AssetType } from '@assets/interface'
import { IsEnum, IsNumber, IsString } from 'class-validator'

export class AssetDto {
  @IsString()
  name: string

  @IsString()
  type: AssetType

  @IsString()
  effectDescription: string

  @IsNumber()
  minimumBid: number

  @IsEnum(AssetStatus)
  status: AssetStatus
}
