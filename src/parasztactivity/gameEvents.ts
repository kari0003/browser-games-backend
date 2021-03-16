import { GameEvent } from '../platform/game/gameEventHandler';

export type EventTypes = 'addWord' | 'drawWord' | 'resetGame' | 'putBackWord' | 'guessWord' | 'endTurn' | 'startTurn';

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
  roomId: string;
  payload: Payloads;
}

export type AddWordPayload = {
  playerId: string;
  word: string;
};

export type DrawWordPayload = {
  playerId: string;
};

export type ResetGamePayload = {};

export type PutBackWordPayload = {};

export type GuessWordPayload = {
  playerId: string;
  guess: string;
};

export type EndTurnPayload = {};

export type StartTurnPayload = {
  playerId: string;
  length: number;
};
