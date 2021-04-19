import { GameEvent } from '../platform/game/gameEventHandler';

export type EventTypes =
  | 'addWord'
  | 'drawWord'
  | 'putBackWord'
  | 'guessWord'
  | 'resetGame'
  | 'endTurn'
  | 'startTurn'
  | 'startRound'
  | 'startGame';

export type Payloads =
  | AddWordPayload
  | DrawWordPayload
  | ResetGamePayload
  | PutBackWordPayload
  | GuessWordPayload
  | EndTurnPayload
  | StartTurnPayload;

export interface ParasztactivityEvent extends GameEvent {
  game: 'parasztactivity';
  eventType: EventTypes;
  roomId: number;
  payload: Payloads;
}

export type AddWordPayload = {
  playerId: string;
  word: string;
};

export type DrawWordPayload = {};

export type ResetGamePayload = {};

export type PutBackWordPayload = {};

export type GuessWordPayload = {
  playerId: string;
  guess: string;
};

export type EndTurnPayload = {};

export type StartGamePayload = {};

export type StartRoundPayload = {};

export type StartTurnPayload = {};
