import { get, set } from '../platform/db/db';

export type Word = { word: string; submittedBy: string };

export type GameState = {
  roomId: number;
  isGameStarted: boolean;
  isTurnInProgress: boolean;
  isRoundInProgress: boolean;
  currentPlayer: string | null;
  roundRobinIndex: number;
  currentWord: Word | null;
  currentTurnStart: number | null;
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
  roomId: -1,
  isGameStarted: false,
  isTurnInProgress: false,
  isRoundInProgress: false,
  currentPlayer: null,
  roundRobinIndex: 0,
  currentWord: null,
  currentTurnStart: null,
  allWords: [],
  hatWords: [],
  settings: {
    minWordPerPlayer: 0,
    maxWordPerPlayer: 3,
    turnLengthSeconds: 500,
  },
  scores: {},
};

export const setState = (state: GameState) => {
  set(`/games/${state.roomId}`, state);
};

export const getState = (roomId: number): GameState => {
  return get(`/games/${roomId}`);
};
