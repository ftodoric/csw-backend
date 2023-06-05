import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { EventCardDto } from './dto'
import { EventCardsRepository } from './event-cards.repository'
import { EventCardName, EventCardStatus } from './interface'

@Injectable()
export class EventCardsService {
  constructor(@InjectRepository(EventCardsRepository) private eventCardsRepository: EventCardsRepository) {}

  async createCard(eventCardDto: EventCardDto, gameId: string): Promise<string> {
    return await this.eventCardsRepository.createCard(eventCardDto, gameId)
  }

  async drawCard(gameId: string): Promise<EventCardName> {
    const cards = await this.eventCardsRepository.getDeck(gameId)

    const min = 0
    const max = cards.length
    const random = Math.floor(Math.random() * (max - min) + min)

    cards.forEach(async (card, i) => {
      // Draw a random card
      if (i === random) {
        await this.eventCardsRepository.save({
          id: card.id,
          status: EventCardStatus.Drawn,
        })
      }
    })

    return cards[random].name
  }
}
