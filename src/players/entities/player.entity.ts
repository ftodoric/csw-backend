import { User } from '@auth/entities'
import { Game } from '@games/entities'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'
import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  user: User

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

  // Game in which the user is active
  @OneToOne(() => Game, (game) => game.id)
  game: Game
}
