import { Game } from '@games/entities'
import { GamesRepository } from '@games/games.repository'
import { Outcome, Period, RoomsTimers, TimerEvents } from '@games/interface'
import { Server, Socket } from 'socket.io'

import { TURN_TIME, getNextTurnActives } from './turn-mechanics'

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
  gamesRepository: GamesRepository
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
      if (game.activePeriod === Period.December) {
        // Accumulate all victory points on each side of the team

        const blueTeamVP =
          game.blueTeam.peoplePlayer.victoryPoints +
          game.blueTeam.industryPlayer.victoryPoints +
          game.blueTeam.governmentPlayer.victoryPoints +
          game.blueTeam.energyPlayer.victoryPoints +
          game.blueTeam.intelligencePlayer.victoryPoints

        const redTeamVP =
          game.redTeam.peoplePlayer.victoryPoints +
          game.redTeam.industryPlayer.victoryPoints +
          game.redTeam.governmentPlayer.victoryPoints +
          game.redTeam.energyPlayer.victoryPoints +
          game.redTeam.intelligencePlayer.victoryPoints

        if (blueTeamVP > redTeamVP) {
          await gamesRepository.save({
            id: game.id,
            outcome: Outcome.BlueWins,
          })
        } else if (redTeamVP > blueTeamVP) {
          await gamesRepository.save({
            id: game.id,
            outcome: Outcome.RedWins,
          })
        } else {
          // TIE
          await gamesRepository.save({
            id: game.id,
            outcome: Outcome.Tie,
          })
        }

        // Team with more VP wins

        clearInterval(timer)
      } else {
        // GAME CONTINUES
        // NEXT TURN
        const { nextPlayer, nextSide, nextPeriod } = getNextTurnActives(
          game.activeSide,
          game.activePeriod
        )

        await gamesRepository.save({
          id: game.id,
          // Reset time
          turnsRemainingTime: TURN_TIME,
          // Change actives
          activePlayer: nextPlayer,
          activeSide: nextSide,
          activePeriod: nextPeriod,
        })

        const refreshedGame = await gamesRepository.findOneBy({ id: game.id })

        clearInterval(timer)
        startRoomTimer(server, roomsTimers, refreshedGame, gamesRepository)
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
