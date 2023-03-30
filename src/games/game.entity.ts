import { IsOptional } from 'class-validator'
import { Team } from 'src/teams/team.entity'
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { GameStatus } from './game-status.enum'

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string

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

  @Column()
  @IsOptional()
  description: string
}
