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
import { clearRoomTimer, getGameIdQuery, getRoomName, startRoomTimer } from './utils/rooms'

@WebSocketGateway()
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server
  private roomsTimers: RoomsTimers = {}

  constructor(@Inject(forwardRef(() => GamesService)) private gamesService: GamesService) {}

  getRoomsTimers() {
    return this.roomsTimers
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.join(getRoomName(gameId))
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const gameId = getGameIdQuery(client)
    client.leave(getRoomName(gameId))
  }

  /**
   * This method continues the timer from the stored value in the Game relation.
   * @param client
   */
  @SubscribeMessage(TimerEvents.StartTimer)
  async handleContinueTimer(@ConnectedSocket() client: Socket): Promise<{ msg: string }> {
    const gameId = getGameIdQuery(client)

    const game = await this.gamesService.getGameById(gameId)

    await startRoomTimer(this, game.id, game.turnsRemainingTime)

    await this.gamesService.continueGame(gameId)

    return { msg: 'success' }
  }

  /**
   * On pause event, the remaining time is persisted in database
   * and timer interval is cleared.
   * @param client
   */
  @SubscribeMessage(TimerEvents.PauseTimer)
  async handlePauseTimer(@ConnectedSocket() client: Socket): Promise<{ msg: string }> {
    const gameId = getGameIdQuery(client)

    // Persist remaining time
    await this.gamesService.pauseGame(gameId, this.roomsTimers[gameId]['current'])

    await clearRoomTimer(this.roomsTimers, gameId)

    return { msg: 'success' }
  }

  /**
   * Server ticks for the client game timer.
   * @param gameId
   * @param time
   */
  async handleTimerTick(gameId: string) {
    this.server.to(getRoomName(gameId)).emit(TimerEvents.Tick, {
      time: this.roomsTimers[gameId]['current'],
    })
  }

  async handleTimerTimeout(gameId: string) {
    const game = await this.gamesService.getGameById(gameId)

    // Check if game ends
    // First update the game
    // then send the tick to client
    await this.gamesService.nextTurn(game.id)
  }

  /**
   * This method is called on the end of a turn.
   * @param gameId
   */
  async handleRestartTimer(gameId: string) {
    const game = await this.gamesService.getGameById(gameId)

    // Send a tick to client
    this.handleTimerTick(gameId)

    clearRoomTimer(this.roomsTimers, gameId)
    startRoomTimer(this, gameId, game.turnsRemainingTime)
  }

  /**
   * This method is called on game end. Exported for other services.
   */
  async stopTimer(gameId: string) {
    // Send one last tick to client
    this.handleTimerTick(gameId)

    // Clear timer
    clearRoomTimer(this.roomsTimers, gameId)
  }
}
