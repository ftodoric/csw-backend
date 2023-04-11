import { Game } from '@games/entities'
import { Player } from '@players/entities'
import { TeamSide } from '@teams/interface'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  side: TeamSide

  @Column()
  name: string

  @ManyToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  peoplePlayer: Player

  @ManyToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  industryPlayer: Player

  @ManyToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  governmentPlayer: Player

  @ManyToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  energyPlayer: Player

  @ManyToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  intelligencePlayer: Player

  @OneToOne(() => Game)
  game: Game
}
