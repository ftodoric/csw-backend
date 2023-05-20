import { GamePeriod } from '@games/interface/game.types'
import { TeamSide } from '@teams/interface'

export const TURN_TIME = 30

export const INITIAL_RESOURCE = 3
export const INITIAL_VITALITY = 4

interface NextActives {
  nextSide: TeamSide
  nextPeriod: GamePeriod
}

export const getNextTurnActives = (activeSide: TeamSide, activePeriod: GamePeriod): NextActives => {
  const nextActives: NextActives = {
    nextSide: activeSide === TeamSide.Blue ? TeamSide.Red : TeamSide.Blue,
    nextPeriod: activeSide === TeamSide.Red ? activePeriod + 1 : activePeriod,
  }

  return nextActives
}
