import { EventCardName } from '@event-cards/interface'
import { GameEntity, GameOutcome, GamePeriod, GameStatus } from '@games/interface/game.types'
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
  timeLimit: number

  @Column()
  turnsRemainingTime: number

  @Column()
  activeSide: TeamSide

  @Column()
  activePeriod: GamePeriod

  @Column()
  isRussianGovernmentAttacked: boolean

  @Column()
  isUkEnergyAttacked: boolean

  @Column()
  isRosenergoatomAttacked: boolean

  @Column({ nullable: true })
  lastAttacker: GameEntity

  @Column({ nullable: true })
  lastAttackStrength: number

  @Column()
  didGCHQRevitaliseThisQuarter: boolean

  @Column()
  recruitmentDriveCurrentQuartersStreak: number

  @Column()
  recruitmentDriveMaxQuartersStreak: number

  @Column('decimal', { scale: 1 })
  energeticBearAprilVitality: number

  @Column('decimal', { scale: 1 })
  energeticBearAugustVitality: number

  @Column()
  didRosenergoatomRevitaliseThisQuarter: boolean

  @Column()
  growCapacityCurrentQuartersStreak: number

  @Column()
  growCapacityMaxQuartersStreak: number

  @Column()
  isRecoveryManagementActive: boolean

  @Column()
  drawnEventCard: EventCardName

  @Column()
  recordKeepingSheet: string

  @OneToOne(() => Team, (team) => team.id, { eager: true })
  @JoinColumn()
  blueTeam: Team

  @OneToOne(() => Team, (team) => team.id, { eager: true })
  @JoinColumn()
  redTeam: Team
}
