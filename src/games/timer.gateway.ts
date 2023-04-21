import { InjectRepository } from '@nestjs/typeorm'
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'

import { GamesRepository } from './games.repository'
import { RoomsTimers, TimerEvents } from './interface'
import {
  getGameIdQuery,
  getRoomName,
  startRoomTimer,
  clearRoomTimer,
} from './utils/rooms'

@WebSocketGateway()
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server
  private roomsTimers: RoomsTimers = {}

  constructor(
    @InjectRepository(GamesRepository) private gamesRepository: GamesRepository
  ) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.join(getRoomName(gameId))
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.leave(getRoomName(gameId))
  }

  @SubscribeMessage(TimerEvents.StartTimer)
  async handleStartTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    await this.gamesRepository.save({ id: gameId, paused: false })

    const game = await this.gamesRepository.findOneBy({ id: gameId })

    startRoomTimer(this.server, this.roomsTimers, game, this.gamesRepository)
  }

  @SubscribeMessage(TimerEvents.PauseTimer)
  async handlePauseTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    // Persist remaining time
    await this.gamesRepository.save({
      id: gameId,
      turnsRemainingTime: this.roomsTimers[gameId]['current'],
      paused: true,
    })

    clearRoomTimer(this.roomsTimers, gameId)
  }
}
