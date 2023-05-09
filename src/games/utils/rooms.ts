import { Game } from '@games/entities'
import { GamesService } from '@games/games.service'
import { GamePeriod } from '@games/interface/game.types'
import { RoomsTimers, TimerEvents } from '@games/interface/timer.types'
import { Server, Socket } from 'socket.io'

/**
 * This function extracts gameId query parameter from
 * WebSocket connection upgrade request.
 *
 * It also assures that the parameter is provided and
 * that it is not a list of strings.
 *
 * @returns {String} gameId
 */
export const getGameIdQuery = (client: Socket) => {
  const gameId = client.handshake.query.gameId

  if (!gameId) throw new Error('Game ID not provided.')

  if (Array.isArray(gameId)) throw new Error('A single Game ID is required.')

  return gameId as string
}

export const getRoomName = (gameId: string) => `room:${gameId}`

export const startRoomTimer = (
  server: Server,
  roomsTimers: RoomsTimers,
  game: Game,
  gamesService: GamesService
) => {
  let time: number = game.turnsRemainingTime

  roomsTimers[game.id] = { current: time, timer: null }

  // Schedule ticks for the room
  const timer = setInterval(async function () {
    server.to(getRoomName(game.id)).emit(TimerEvents.Tick, {
      time: time,
    })

    // Store new time
    roomsTimers[game.id]['current'] = time

    if (time > 0) {
      time--
    } else {
      // Check if game ends
      if (game.activePeriod === GamePeriod.December) {
        gamesService.prepareGameOver(game.id)

        this.clearInterval(timer)
      } else {
        // GAME CONTINUES
        // NEXT TURN
        await gamesService.nextTurnOnTimeout(game.id)

        const refreshedGame = await gamesService.getGameById(game.id)

        clearInterval(timer)
        startRoomTimer(server, roomsTimers, refreshedGame, gamesService)
      }
    }
  }, 1000)

  // Store this rooms timer
  roomsTimers[game.id]['timer'] = timer
}

export function clearRoomTimer(roomTimers: RoomsTimers, gameId: string) {
  // Deschedule
  clearInterval(roomTimers[gameId]['timer'])

  // Delete from memory
  delete roomTimers[gameId]
}
