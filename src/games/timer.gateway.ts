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
import { TeamSide } from '@teams/interface'
import { Server, Socket } from 'socket.io'

import { GamePeriod } from './interface/game.types'
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
  async handleContinueTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    const game = await this.gamesService.getGameById(gameId)

    startRoomTimer(this, game.id, game.turnsRemainingTime)

    this.gamesService.continueGame(gameId)
  }

  /**
   * On pause event, the remaining time is persisted in database
   * and timer interval is cleared.
   * @param client
   */
  @SubscribeMessage(TimerEvents.PauseTimer)
  async handlePauseTimer(@ConnectedSocket() client: Socket): Promise<void> {
    const gameId = getGameIdQuery(client)

    // Persist remaining time
    await this.gamesService.pauseGame(gameId, this.roomsTimers[gameId]['current'])

    clearRoomTimer(this.roomsTimers, gameId)
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
    if (game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Red) {
      // First update the game
      // then send the tick to client
      await this.gamesService.setGameOver(game.id)

      this.handleTimerTick(game.id)

      // Clear timer
      clearRoomTimer(this.roomsTimers, game.id)
    } else {
      // GAME CONTINUES
      this.handleTimerTick(game.id)

      // This method contains clearing the timers interval and restarting it
      // because this method can be called on user action too
      await this.gamesService.nextTurn(game.id)
    }
  }

  /**
   * This method is called on the end of a turn.
   * @param gameId
   */
  async handleRestartTimer(gameId: string) {
    const game = await this.gamesService.getGameById(gameId)

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
