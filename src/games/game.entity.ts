import { IsOptional } from 'class-validator';
import { Team } from 'src/teams/team.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @IsOptional()
  @Column()
  description: string;

  @Column()
  status: string;

  @OneToOne(() => Team, (team) => team.id)
  @JoinColumn()
  blueTeam: Team;

  @OneToOne(() => Team, (team) => team.id)
  @JoinColumn()
  redTeam: Team;
}
