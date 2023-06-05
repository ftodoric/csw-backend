import { Player } from '@players/entities'
import { TeamSide } from '@teams/interface'
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  side: TeamSide

  @Column()
  name: string

  @Column()
  isEventCardRead: boolean

  @OneToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  peoplePlayer: Player

  @OneToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  industryPlayer: Player

  @OneToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  governmentPlayer: Player

  @OneToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  energyPlayer: Player

  @OneToOne(() => Player, (player) => player.id, { eager: true })
  @JoinColumn()
  intelligencePlayer: Player
}
