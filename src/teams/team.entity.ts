import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  side: string;

  @Column()
  governmentId: string;

  @Column()
  bussinesId: string;

  @Column()
  populationId: string;

  @Column()
  militaryId: string;

  @Column()
  energyId: string;
}
