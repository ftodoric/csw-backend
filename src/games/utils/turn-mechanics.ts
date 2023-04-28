import { Period } from '@games/interface'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'

export const TURN_TIME = 5

interface NextActives {
  nextPlayer: PlayerType
  nextSide: TeamSide
  nextPeriod: Period
}

export const getNextTurnActives = (
  activeSide: TeamSide,
  activePeriod: Period
): NextActives => {
  const nextActives: NextActives = {
    nextPlayer: PlayerType.People,
    nextSide: activeSide === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue,
    nextPeriod: activePeriod + 1,
  }

  return nextActives
}
