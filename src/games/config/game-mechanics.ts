import { Game } from '@games/entities'
import { GamePeriod } from '@games/interface/game.types'
import { Player } from '@players/entities'
import { PlayerType } from '@players/interface'
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

export const isAttackAllowed = (game: Game, entityPlayer: Player) => {
  return (
    (entityPlayer.side === TeamSide.Blue &&
      entityPlayer.type === PlayerType.Government &&
      game.isRussianGovernmentAttacked) ||
    (entityPlayer.side === TeamSide.Blue &&
      entityPlayer.type === PlayerType.Intelligence &&
      game.isRosenergoatomAttacked) ||
    (entityPlayer.side === TeamSide.Red && entityPlayer.type === PlayerType.People) ||
    (entityPlayer.side === TeamSide.Red && entityPlayer.type === PlayerType.Industry) ||
    (entityPlayer.side === TeamSide.Red && entityPlayer.type === PlayerType.Intelligence && game.isUkEnergyAttacked)
  )
}

export const combatResolutionTable = [
  [0, 1, 1, 1, 1, 2],
  [0, 1, 1, 1, 2, 2],
  [-1, 0, 1, 2, 2, 3],
  [-1, 0, 1, 2, 3, 4],
  [-2, -1, 2, 3, 3, 4],
  [-2, -1, 0, 3, 5, 6],
]

export const attackTargetMap = {
  [TeamSide.Blue]: {
    [PlayerType.Government]: [PlayerType.Government],
    [PlayerType.Intelligence]: [PlayerType.Energy],
  },
  [TeamSide.Red]: {
    [PlayerType.People]: [PlayerType.People],
    [PlayerType.Industry]: [PlayerType.Industry],
    [PlayerType.Intelligence]: [PlayerType.Energy],
  },
}

export const attackSplashMap = {
  [TeamSide.Blue]: {
    [PlayerType.People]: [PlayerType.Industry, PlayerType.Government, PlayerType.Energy],
    [PlayerType.Industry]: [PlayerType.People, PlayerType.Government, PlayerType.Intelligence],
    [PlayerType.Government]: [PlayerType.People, PlayerType.Industry, PlayerType.Energy, PlayerType.Intelligence],
    [PlayerType.Energy]: [PlayerType.People, PlayerType.Government],
    [PlayerType.Intelligence]: [PlayerType.Industry, PlayerType.Government],
  },
  [TeamSide.Red]: {
    [PlayerType.People]: [PlayerType.Government],
    [PlayerType.Industry]: [PlayerType.Government, PlayerType.Intelligence],
    [PlayerType.Government]: [PlayerType.People, PlayerType.Industry, PlayerType.Energy, PlayerType.Intelligence],
    [PlayerType.Energy]: [PlayerType.Government],
    [PlayerType.Intelligence]: [PlayerType.Industry, PlayerType.Government],
  },
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
