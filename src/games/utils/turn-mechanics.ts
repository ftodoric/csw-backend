import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'

export const TURN_TIME = 10

export const getNextActives = (
  activePlayer: PlayerType,
  activeSide: TeamSide
) => {
  switch (activePlayer) {
    case PlayerType.People:
      return { nextPlayer: PlayerType.Industry, nextSide: activeSide }
    case PlayerType.Industry:
      return { nextPlayer: PlayerType.Government, nextSide: activeSide }
    case PlayerType.Government:
      return { nextPlayer: PlayerType.Energy, nextSide: activeSide }
    case PlayerType.Energy:
      return { nextPlayer: PlayerType.Intelligence, nextSide: activeSide }
    case PlayerType.Intelligence:
      return {
        nextPlayer: PlayerType.People,
        nextSide: activeSide === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue,
      }
  }
}
