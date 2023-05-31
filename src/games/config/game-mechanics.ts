import { GamePeriod } from '@games/interface/game.types'
import { TeamSide } from '@teams/interface'

export const TURN_TIME = 60 * 10

export const INITIAL_RESOURCE = 3
export const INITIAL_VITALITY = 4

export const GOVERNMENT_NEW_TURN_RESOURCE_ADDITION = 3

export const MAX_NUMBER_OF_RESOURCE_PER_TRANSFER = 5

export const MAX_AMOUNT_OF_REVITALIZATION = 6

export const revitalisationConversionRate: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
}

interface NextActives {
  nextSide: TeamSide
  nextPeriod: GamePeriod
}

export const getNextTurnActives = (activeSide: TeamSide, activePeriod: GamePeriod): NextActives => {
  const nextActives: NextActives = {
    nextSide: activeSide === TeamSide.Red ? TeamSide.Blue : TeamSide.Red,
    nextPeriod: activeSide === TeamSide.Blue ? activePeriod + 1 : activePeriod,
  }

  return nextActives
}
