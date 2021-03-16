import { get, set } from '../platform/db/db';

export type Word = { word: string; submittedBy: string };

export type GameState = {
  roomId: string;
  players: string[];
  currentPlayer: string | null;
  currentWord: Word | null;
  currentTurnStart: string | null;
  allWords: Word[];
  hatWords: Word[];
  settings: {
    minWordPerPlayer: number;
    maxWordPerPlayer: number;
    turnLengthSeconds: number;
  };
  scores: { [playerId: string]: number };
};

export const initialState: GameState = {
  roomId: 'null',
  players: [],
  currentPlayer: null,
  currentWord: null,
  currentTurnStart: null,
  allWords: [],
  hatWords: [],
  settings: {
    minWordPerPlayer: 0,
    maxWordPerPlayer: 3,
    turnLengthSeconds: 30,
  },
  scores: {},
};

export const setState = (state: GameState) => {
  set(`/games[${state.roomId}]`, state);
};

export const getState = (roomId: string): GameState => {
  return get(`/games[${roomId}]`) as GameState;
};
