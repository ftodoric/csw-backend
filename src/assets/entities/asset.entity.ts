import { AssetStatus, AssetType } from '@assets/interface'
import { TeamSide } from '@teams/interface'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  type: AssetType

  @Column()
  effectDescription: string

  @Column()
  minimumBid: number

  @Column()
  blueTeamBid: number

  @Column()
  redTeamBid: number

  @Column()
  status: AssetStatus

  @Column()
  turnsFromFirstBid: number

  @Column()
  lastBidSide: TeamSide

  @Column()
  gameId: string
}
