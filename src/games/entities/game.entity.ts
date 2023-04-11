import { GameStatus } from '@games/interface'
import { Team } from '@teams/entities'
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  ownerId: string

  @OneToOne(() => Team, (team) => team.id, { eager: true })
  @JoinColumn()
  blueTeam: Team

  @OneToOne(() => Team, (team) => team.id, { eager: true })
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
