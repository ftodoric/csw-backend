import { GameStatus, GameOutcome, GamePeriod } from '@games/interface/game.types'
import { Team } from '@teams/entities'
import { TeamSide } from '@teams/interface'
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  ownerId: string

  @Column()
  status: GameStatus

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  outcome: GameOutcome

  @Column()
  turnsRemainingTime: number

  @Column()
  activeSide: TeamSide

  @Column()
  activePeriod: GamePeriod

  @OneToOne(() => Team, (team) => team.id, { eager: true })
  @JoinColumn()
  blueTeam: Team

  @OneToOne(() => Team, (team) => team.id, { eager: true })
  @JoinColumn()
  redTeam: Team
}
