import { GameEntity, GamePeriod } from '@games/interface/game.types'
import { PlayerType } from '@players/interface'
import { TeamSide } from '@teams/interface'

export const gameEntityMap = (teamSide: TeamSide, playerType: PlayerType) => {
  const isBlue = teamSide === TeamSide.Blue

  switch (playerType) {
    case PlayerType.Government:
      return isBlue ? GameEntity.UKGovernment : GameEntity.RussianGovernment

    case PlayerType.People:
      return isBlue ? GameEntity.Electorate : GameEntity.OnlineTrolls

    case PlayerType.Industry:
      return isBlue ? GameEntity.UKPLC : GameEntity.EnergeticBear

    case PlayerType.Energy:
      return isBlue ? GameEntity.UKEnergy : GameEntity.Rosenergoatom

    case PlayerType.Intelligence:
      return isBlue ? GameEntity.GCHQ : GameEntity.SCS
  }
}

export const calculateDamage = (attackStrength: number, armor: number, armorDuration: number) => {
  const appliedArmor = armorDuration > 0 ? armor : 0
  return ((100 - appliedArmor) / 100) * attackStrength
}

// TODO: use this function for damage calculation
export const calculateDamageV2 = (attackStrength: number, armor: number, isSplashDamage: boolean) => {
  const damage = ((100 - armor) / 100) * attackStrength

  // todo define splash damage ratio config variable
  return isSplashDamage ? damage / 2 : damage
}

export const gamePeriodMap = {
  [GamePeriod.January]: 'January',
  [GamePeriod.February]: 'February',
  [GamePeriod.March]: 'March',
  [GamePeriod.April]: 'April',
  [GamePeriod.May]: 'May',
  [GamePeriod.June]: 'June',
  [GamePeriod.July]: 'July',
  [GamePeriod.August]: 'August',
  [GamePeriod.September]: 'September',
  [GamePeriod.October]: 'October',
  [GamePeriod.November]: 'November',
  [GamePeriod.December]: 'December',
}
