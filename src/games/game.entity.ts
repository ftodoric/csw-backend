import { nanoid } from 'nanoid'
import { Team } from 'src/teams/team.entity'
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'

import { GameStatus } from './game-status.enum'

@Entity()
export class Game {
  @PrimaryColumn()
  id: string = nanoid(5)

  @Column()
  ownerId: string

  @OneToOne(() => Team, (team) => team.id)
  @JoinColumn()
  blueTeam: Team

  @OneToOne(() => Team, (team) => team.id)
  @JoinColumn()
  redTeam: Team

  @Column()
  status: GameStatus

  @Column({ nullable: true })
  description: string

  @OneToOne(() => Team, (team) => team.id, { nullable: true })
  @JoinColumn()
  winner: Team
}
