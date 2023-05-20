import { User } from '@auth/entities'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  side: TeamSide

  @Column()
  type: PlayerType

  @Column()
  resource: number

  @Column()
  vitality: number

  @Column()
  victoryPoints: number

  @Column()
  hasMadeAction: boolean

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  user: User
}
