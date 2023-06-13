import { User } from '@auth/entities'
import { GameAction } from '@games/interface/game.types'
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

  @Column('decimal', { scale: 1 })
  vitality: number

  @Column()
  victoryPoints: number

  @Column({ nullable: true })
  madeAction: GameAction

  @Column()
  biddingBanRemainingTurns: number

  @Column()
  hasMadeBid: boolean

  @Column()
  attackBanRemainingTurns: number

  @Column()
  paralysisRemainingTurns: number

  /**
   * Damage mitigating modifier. Resulting damage is calculated as (100 - armor) / 100 * attack.
   * Initial value: 0
   */
  @Column()
  armor: number

  @Column()
  armorDuration: number

  @Column()
  hasSufferedAnyDamage: boolean

  @Column()
  damageImmunityDuration: number

  @Column()
  isSplashImmune: boolean

  @Column()
  hasDoubleDamage: boolean

  @Column()
  hasCyberInvestmentProgramme: boolean

  @Column()
  hasRansomwareAttack: boolean

  @Column()
  wasRansomwareAttacked: boolean

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  user: User
}
