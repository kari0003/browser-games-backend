import { Socket } from 'socket.io';
import { getRoom } from '../platform/db/db';
import { GameEvent } from '../platform/game/gameEventHandler';
import { getRoomChannel } from '../platform/room/roomSocketHandler';
import { UserError } from '../platform/socketHandler/registerSocketHandler';
import { AddWordPayload, GuessWordPayload, StartTurnPayload } from './gameEvents';
import { GameState, getState, initialState, setState } from './gameState';

export const parasztactivityInitializer = (s: Socket, { roomId }: { roomId: number }) => {
  const state = { ...initialState };
  state.roomId = roomId;
  return setState(state);
};

export const getParasztactivityState = (s: Socket, roomId: number) => {
  const state = getState(roomId);
  const gameState = toPublicState(state);
  s.emit('gameState', { gameState });
};

export const broadcastGameState = (s: Socket, state: GameState) => {
  const room = getRoom(state.roomId);
  console.log('broadcastGameState', state.roomId);
  if (!room) {
    throw new UserError('roomNotFound', 'room for game does not exist');
  }
  const gameState = toPublicState(state);
  s.nsp.to(getRoomChannel(room)).emit('gameState', { gameState });
};

export const parasztactivityEventHandler = (s: Socket, event: GameEvent) => {
  const state = getState(event.roomId);
  if (event.eventType === 'addWord') {
    const payload = event.payload as AddWordPayload;
    state.allWords.push({ submittedBy: payload.playerId, word: payload.word });
    broadcastGameState(s, state);
    return setState(state);
  }

  if (event.eventType === 'drawWord') {
    if (s.id !== state.currentPlayer) {
      throw new UserError('illegalAction', 'you are not the current player!');
    }
    if (state.hatWords.length > 0) {
      const index = getRandomId(state.hatWords);
      state.currentWord = state.hatWords[index];
      state.hatWords = state.hatWords.filter((_, id) => id === index);
      broadcastGameState(s, state);
      s.emit('drawWordReply', { word: state.currentWord.word });
      return setState(state);
    }
  }

  if (event.eventType === 'putBackWord') {
    if (state.currentWord !== null) {
      state.hatWords.push(state.currentWord);
      state.currentWord = null;
      broadcastGameState(s, state);
      return setState(state);
    }
  }

  if (event.eventType === 'guessWord') {
    const payload = event.payload as GuessWordPayload;
    if (state.currentWord && state.currentWord.word === payload.guess) {
      console.log('Guess correct!');
      state.currentWord = null;
      state.scores[payload.playerId] = 1 + (state.scores[payload.playerId] || 0);
      if (state.hatWords.length === 0) {
        console.log('end turn');
      }
      broadcastGameState(s, state);
      return setState(state);
    } else {
      console.log('Guess incorrect');
    }
  }

  if (event.eventType === 'resetGame') {
    //const _payload = event.payload as ResetGamePayload;
    state.allWords = [];
    state.hatWords = [];
    state.scores = {};
    state.currentPlayer = null;
    state.currentTurnStart = null;
    state.currentWord = null;
    broadcastGameState(s, state);
    return setState(state);
  }

  if (event.eventType === 'endTurn') {
    if (state.currentPlayer) {
      state.currentPlayer = null;
      state.currentTurnStart = null;
      broadcastGameState(s, state);
      return setState(state);
    }
  }

  if (event.eventType === 'startTurn') {
    const payload = event.payload as StartTurnPayload;
    if (state.currentPlayer) {
      console.log('Turn already started!');
      return;
    }
    state.currentPlayer = payload.playerId;
    state.currentTurnStart = Date.now();
    broadcastGameState(s, state);
    return setState(state);
  }

  // TODO replace with reducer
};

const getRandomId = (words: unknown[]): number => {
  return (Math.random() * words.length) % words.length;
};

export const getHatWordCount = (state: GameState): number => {
  return state.isRoundInProgress ? state.hatWords.length : state.allWords.length;
};

const toPublicState = (state: GameState) => {
  return {
    roomId: state.roomId,
    currentPlayer: state.currentPlayer,
    currentTurnStart: state.currentTurnStart,
    settings: state.settings,
    scores: state.scores,
    hatWordCount: getHatWordCount(state),
  };
};
