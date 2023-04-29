export interface RoomTimer {
  current: number
  timer: NodeJS.Timer | null
}

export interface RoomsTimers {
  [gameId: string]: RoomTimer
}

export enum TimerEvents {
  StartTimer = 'startTimer',
  PauseTimer = 'pauseTimer',
  Tick = 'tick',
}
