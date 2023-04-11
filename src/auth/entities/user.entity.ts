import { Player } from '@players/entities'
import { Team } from '@teams/entities'
import { Exclude } from 'class-transformer'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  username: string

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string

  @OneToMany(() => Team, (team) => team.peoplePlayer)
  peoplePlayer: Team

  @OneToMany(() => Team, (team) => team.industryPlayer)
  industryPlayer: Team

  @OneToMany(() => Team, (team) => team.governmentPlayer)
  governmentPlayer: Team

  @OneToMany(() => Team, (team) => team.energyPlayer)
  energyPlayer: Team

  @OneToMany(() => Team, (team) => team.intelligencePlayer)
  intelligencePlayer: Team

  @OneToMany(() => Player, (player) => player.id)
  player: Player
}
