import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { DataSource, Repository } from 'typeorm'

import { EventCardDto } from './dto'
import { EventCard } from './entities'
import { EventCardStatus } from './interface'

@Injectable()
export class EventCardsRepository extends Repository<EventCard> {
  constructor(dataSource: DataSource) {
    super(EventCard, dataSource.createEntityManager())
  }

  async createCard(eventCardDto: EventCardDto, gameId: string): Promise<string> {
    const eventCard = await this.create({
      ...eventCardDto,
      gameId,
    })

    try {
      await this.save(eventCard)
    } catch (error) {
      // Duplicate event card
      if (error.code === '23505') throw new ConflictException(`Event Card with ID ${eventCard.id} already exists.`)
      else throw new InternalServerErrorException('Event card creation failed.')
    }

    return eventCard.id
  }

  async getDeck(gameId: string): Promise<EventCard[]> {
    const query = this.createQueryBuilder('eventCard')
      .where('eventCard.gameId = :gameId', { gameId })
      .andWhere('eventCard.status = :status', { status: EventCardStatus.InDeck })

    return query.getMany()
  }
}
