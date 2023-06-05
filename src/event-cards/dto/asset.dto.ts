import { EventCardName, EventCardStatus } from '@event-cards/interface'
import { IsEnum, IsString } from 'class-validator'

export class EventCardDto {
  @IsString()
  name: EventCardName

  @IsEnum(EventCardStatus)
  status: EventCardStatus
}
