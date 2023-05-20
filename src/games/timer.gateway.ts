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
   * Ticks for the client. Is finished is used for updating the frontend page at the final tick.
   * @param gameId
   * @param time
   * @param isFinished is the game finished, not turn
   */
  async handleTimerTick(gameId: string, isFinished: boolean) {
    this.server.to(getRoomName(gameId)).emit(TimerEvents.Tick, {
      time: this.roomsTimers[gameId]['current'],
      isFinished: isFinished,
    })
  }

  async handleTimerTimeout(gameId: string) {
    const game = await this.gamesService.getGameById(gameId)

    // Check if game ends
    if (game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Red) {
      this.handleTimerTick(game.id, true)

      // Clear timer
      clearRoomTimer(this.roomsTimers, game.id)

      this.gamesService.setGameOver(game.id)
    } else {
      // GAME CONTINUES
      this.handleTimerTick(game.id, false)

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
}
