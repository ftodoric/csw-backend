import { Game } from 'src/games/game.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SideEnum } from './team.interface';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  side: SideEnum;

  @Column()
  name: string;

  @Column()
  govPlayerId: string;

  @Column()
  busPlayerId: string;

  @Column()
  popPlayerId: string;

  @Column()
  milPlayerId: string;

  @Column()
  enePlayerId: string;

  @OneToOne(() => Game, { eager: false })
  game: Game;
}
