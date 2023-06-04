import { GameEntity } from '@games/interface/game.types'
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
