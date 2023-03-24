import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  status: string;

  @Column()
  blueTeamId: string;

  @Column()
  redTeamId: string;
}
