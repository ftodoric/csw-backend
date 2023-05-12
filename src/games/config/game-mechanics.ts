import { GamePeriod } from '@games/interface/game.types'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'

export const TURN_TIME = 3

interface NextActives {
  nextPlayer: PlayerType
  nextSide: TeamSide
  nextPeriod: GamePeriod
}

export const getNextTurnActives = (
  activeSide: TeamSide,
  activePeriod: GamePeriod
): NextActives => {
  const nextActives: NextActives = {
    nextPlayer: PlayerType.People,
    nextSide: activeSide === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue,
    nextPeriod: activeSide === TeamSide.Red ? activePeriod + 1 : activePeriod,
  }

  return nextActives
}

export const getNextActivesOnUserAction = (
  activePlayer: PlayerType,
  activeSide: TeamSide,
  activePeriod: GamePeriod
): NextActives => {
  const nextActives: NextActives = {
    nextPlayer: activePlayer,
    nextSide: activeSide,
    nextPeriod: activePeriod,
  }

  switch (activePlayer) {
    case PlayerType.People:
      nextActives.nextPlayer = PlayerType.Industry
      break
    case PlayerType.Industry:
      nextActives.nextPlayer = PlayerType.Government
      break
    case PlayerType.Government:
      nextActives.nextPlayer = PlayerType.Energy
      break
    case PlayerType.Energy:
      nextActives.nextPlayer = PlayerType.Intelligence
      break
    case PlayerType.Intelligence:
      nextActives.nextPlayer = PlayerType.People

      // Change side
      if (activeSide === TeamSide.Blue) nextActives.nextSide = TeamSide.Red
      else nextActives.nextSide = TeamSide.Blue

      // Increment period
      if (activeSide === TeamSide.Red) nextActives.nextPeriod = activePeriod + 1

      break
  }

  return nextActives
}
