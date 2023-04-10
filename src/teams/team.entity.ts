import { User } from '@auth/user.entity'
import { Game } from '@games/game.entity'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { TeamSide } from './team-side.enum'

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  side: TeamSide

  @Column()
  name: string

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn()
  peoplePlayer: User

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn()
  industryPlayer: User

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn()
  governmentPlayer: User

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn()
  energyPlayer: User

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn()
  intelligencePlayer: User

  @OneToOne(() => Game)
  game: Game
}
