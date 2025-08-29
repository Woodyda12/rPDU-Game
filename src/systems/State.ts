export type GameState = 'MENU' | 'PLAY' | 'PAUSED' | 'WON';

export class StateMachine {
  private _state: GameState = 'MENU';
  private listeners: Array<(s: GameState)=>void> = [];
  get state(){ return this._state; }
  set(s: GameState){
    this._state = s;
    this.listeners.forEach(cb=>cb(s));
  }
  onChange(cb:(s:GameState)=>void){ this.listeners.push(cb); }
}
