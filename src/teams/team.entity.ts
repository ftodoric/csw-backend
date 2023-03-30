import { Game } from 'src/games/game.entity'
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TeamSide } from './team-side.enum'

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  side: TeamSide

  @Column()
  name: string

  @Column()
  peoplePlayerId: string

  @Column()
  industryPlayerId: string

  @Column()
  governmentPlayerId: string

  @Column()
  energyPlayerId: string

  @Column()
  intelligencePlayerId: string

  @OneToOne(() => Game)
  game: Game
}
