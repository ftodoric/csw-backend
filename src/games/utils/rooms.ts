import { RoomsTimers } from '@games/interface/timer.types'
import { WSGateway } from '@games/ws.gateway'
import { Socket } from 'socket.io'

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

export const startRoomTimer = (wsGateway: WSGateway, gameId: string, turnsRemainingTime: number) => {
  const roomsTimers = wsGateway.getRoomsTimers()
  let time = turnsRemainingTime

  roomsTimers[gameId] = { current: time, timer: null }

  // Schedule ticks for the room
  const timer = setInterval(async function () {
    // Store new time
    roomsTimers[gameId]['current'] = time

    if (time > 0) {
      wsGateway.handleTimerTick(gameId)
      time--
    } else {
      wsGateway.handleTimerTimeout(gameId)
    }
  }, 1000)

  // Store this room timer
  roomsTimers[gameId]['timer'] = timer
}

export function clearRoomTimer(roomsTimers: RoomsTimers, gameId: string) {
  // Deschedule
  clearInterval(roomsTimers[gameId]['timer'])

  // Delete from memory
  delete roomsTimers[gameId]
}
