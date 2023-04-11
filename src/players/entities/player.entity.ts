import { User } from '@auth/entities'
import { Exclude } from 'class-transformer'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  user: User

  @Column()
  resource: number

  @Column()
  vitality: number

  @Column()
  victoryPoints: number
}
