import { Socket } from 'socket.io';
import { GameEvent } from '../platform/game/gameEventHandler';
import { AddWordPayload } from './gameEvents';
import { getState, setState } from './gameState';

export const parasztactivityEventHandler = (s: Socket, event: GameEvent) => {
  const state = getState(event.roomId);
  if (event.eventType === 'addWord') {
    const payload = event.payload as AddWordPayload;
    state.allWords.push({ submittedBy: payload.playerId, word: payload.word });
    return setState(state);
  }

  if (event.eventType === 'resetGame') {
    //const _payload = event.payload as ResetGamePayload;
    state.allWords = [];
    state.hatWords = [];
    state.scores = {};
    state.currentPlayer = null;
    state.currentTurnStart = null;
    state.currentWord = null;
    return setState(state);
  }
  // TODO replace with reducer
};
