import { EventCardName, EventCardStatus } from '@event-cards/interface'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class EventCard {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: EventCardName

  @Column()
  status: EventCardStatus

  @Column()
  gameId: string
}
