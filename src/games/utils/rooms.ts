import { Game } from '@games/entities'
import { GamesService } from '@games/games.service'
import { GamePeriod } from '@games/interface/game.types'
import { RoomsTimers, TimerEvents } from '@games/interface/timer.types'
import { TeamSide } from '@teams/interface'
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

export const startRoomTimer = (server: Server, roomsTimers: RoomsTimers, game: Game, gamesService: GamesService) => {
  let time: number = game.turnsRemainingTime

  roomsTimers[game.id] = { current: time, timer: null }

  // Schedule ticks for the room
  const timer = setInterval(async function () {
    // Store new time
    roomsTimers[game.id]['current'] = time

    if (time > 0) {
      server.to(getRoomName(game.id)).emit(TimerEvents.Tick, {
        time: time,
        isFinished: false,
      })

      time--
    } else {
      // Check if game ends
      if (game.activePeriod === GamePeriod.December && game.activeSide === TeamSide.Red) {
        server.to(getRoomName(game.id)).emit(TimerEvents.Tick, {
          time: time,
          isFinished: true,
        })

        const remainingTime = stopTimer(roomsTimers, game.id)

        gamesService.setGameOver(game.id, remainingTime)
      } else {
        // GAME CONTINUES
        // NEXT TURN
        server.to(getRoomName(game.id)).emit(TimerEvents.Tick, {
          time: time,
          isFinished: false,
        })

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

/**
 * This function is called on the game end.
 * Timer is stoped, remaining time saved and timer deleted.
 * @param gameId
 */
export const stopTimer = (roomsTimers: RoomsTimers, gameId): number => {
  const remainingTime = roomsTimers[gameId].current

  // Clear timer
  clearRoomTimer(roomsTimers, gameId)

  // Return remaining time for game stats
  return remainingTime
}
