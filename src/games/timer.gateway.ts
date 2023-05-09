import { Inject, forwardRef } from '@nestjs/common'
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { GamesService } from '@games'
import { Server, Socket } from 'socket.io'

import { RoomsTimers, TimerEvents } from './interface/timer.types'
import {
  clearRoomTimer,
  getGameIdQuery,
  getRoomName,
  startRoomTimer,
} from './utils/rooms'

@WebSocketGateway()
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server
  private roomsTimers: RoomsTimers = {}

  constructor(
    @Inject(forwardRef(() => GamesService)) private gamesService: GamesService
  ) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.join(getRoomName(gameId))
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.leave(getRoomName(gameId))
  }

  /**
   * This method continues the timer from whatever stored value in the game relation.
   * @param client
   */
  @SubscribeMessage(TimerEvents.StartTimer)
  async handleContinueTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    await this.gamesService.continueGame(gameId)

    const game = await this.gamesService.getGameById(gameId)

    startRoomTimer(this.server, this.roomsTimers, game, this.gamesService)
  }

  @SubscribeMessage(TimerEvents.PauseTimer)
  async handlePauseTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    // Persist remaining time
    this.gamesService.pauseGame(gameId, this.roomsTimers[gameId]['current'])

    clearRoomTimer(this.roomsTimers, gameId)
  }

  /**
   * This function is called on the game end.
   * Timer is stoped, remaining time saved and timer deleted.
   * @param gameId
   */
  stopTimer(gameId): number {
    const remainingTime = this.roomsTimers[gameId].current

    // Clear timer
    clearRoomTimer(this.roomsTimers, gameId)

    // Return remaining time for game stats
    return remainingTime
  }

  /**
   * This method is called on each user action and timer is restarted.
   * @param gameId
   */
  async restartTimer(gameId: string) {
    // Reset turns remaining time in the database
    await this.gamesService.resetTurnsTime(gameId)

    const refreshedGame = await this.gamesService.getGameById(gameId)

    clearRoomTimer(this.roomsTimers, gameId)
    startRoomTimer(
      this.server,
      this.roomsTimers,
      refreshedGame,
      this.gamesService
    )
  }
}
