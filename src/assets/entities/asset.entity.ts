import { AssetStatus, AssetType } from '@assets/interface'
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
  gameId: string
}
