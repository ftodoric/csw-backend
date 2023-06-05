import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EventCard } from './entities'
import { EventCardsRepository } from './event-cards.repository'
import { EventCardsService } from './event-cards.service'

@Module({
  providers: [EventCardsService, EventCardsRepository],
  imports: [TypeOrmModule.forFeature([EventCard])],
  exports: [EventCardsService],
})
export class EventCardsModule {}
