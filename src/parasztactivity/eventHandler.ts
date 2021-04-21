import { Socket } from 'socket.io';
import { getRoom, get } from '../platform/db/db';
import { GameEvent } from '../platform/game/gameEventHandler';
import { findPlayerBySocket } from '../platform/player/playerSocketHandler';
import { Room } from '../platform/room/room';
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
  const state = { ...getState(event.roomId) };

  const room = get<Room>(`/rooms[${state.roomId}]`);
  const player = findPlayerBySocket(s.id);

  if (event.eventType === 'addWord') {
    const payload = event.payload as AddWordPayload;
    state.allWords.push({ submittedBy: payload.playerId, word: payload.word });
    broadcastGameState(s, state);
    return setState(state);
  }

  if (event.eventType === 'drawWord') {
    if (player.id !== state.currentPlayer) {
      throw new UserError('illegalAction', 'you are not the current player!');
    }
    if (state.hatWords.length > 0) {
      console.log('drawing word');
      const index = getRandomId(state.hatWords);
      console.log(index, state.hatWords);
      state.currentWord = state.hatWords[index];
      state.hatWords = state.hatWords.filter((_, id) => id === index);
      broadcastGameState(s, state);
      s.emit('drawWordReply', { word: state.currentWord.word });
      return setState(state);
    }
  }

  if (event.eventType === 'putBackWord') {
    if (player.id !== state.currentPlayer) {
      throw new UserError('illegalAction', 'you are not the current player!');
    }
    if (state.currentWord !== null) {
      state.hatWords.push(state.currentWord);
      state.currentWord = null;
      broadcastGameState(s, state);
      s.emit('putBackWordReply', { word: null });
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
        console.log('no Words, end turn');
        state.isTurnInProgress = false;
        state.isRoundInProgress = false;
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
    if (state.isTurnInProgress) {
      state.currentPlayer = null;
      state.currentTurnStart = null;
      state.isTurnInProgress = false;
      if (state.currentWord) {
        state.hatWords.push(state.currentWord);
      }
      broadcastGameState(s, state);
      return setState(state);
    }
  }

  if (event.eventType === 'startGame') {
    if (state.isGameStarted) {
      throw new UserError('illegalAction', 'Game already started!');
    }
    state.isGameStarted = true;
    state.isRoundInProgress = false;
    state.isTurnInProgress = false;
    state.scores = {};

    state.roundRobinIndex = 0;
    state.hatWords = [...state.allWords];
    state.currentPlayer = room.players[state.roundRobinIndex].id;

    broadcastGameState(s, state);
    return setState(state);
  }

  if (event.eventType === 'startRound') {
    if (state.isRoundInProgress) {
      throw new UserError('illegalAction', 'Round already started!');
    }
    state.isRoundInProgress = true;
    state.isTurnInProgress = false;
    state.hatWords = [...state.allWords];

    state.roundRobinIndex = (state.roundRobinIndex + 1) % room.players.length;
    state.currentPlayer = room.players[state.roundRobinIndex].id;

    broadcastGameState(s, state);
    return setState(state);
  }

  if (event.eventType === 'startTurn') {
    if (state.isTurnInProgress) {
      throw new UserError('illegalAction', 'Turn already started!');
    }
    state.isTurnInProgress = true;
    state.currentTurnStart = Date.now();

    state.roundRobinIndex = (state.roundRobinIndex + 1) % room.players.length;
    state.currentPlayer = room.players[state.roundRobinIndex].id;

    setTimeout(() => {
      console.log('turn over timeout!');
      state.isTurnInProgress = false;
    }, state.settings.turnLengthSeconds);

    broadcastGameState(s, state);
    return setState(state);
  }
  // TODO replace with reducer
};

const getRandomId = (words: unknown[]): number => {
  return Math.floor(Math.random() * words.length) % words.length;
};

export const getHatWordCount = (state: GameState): number => {
  return state.isRoundInProgress ? state.hatWords.length : state.allWords.length;
};

const toPublicState = (state: GameState) => {
  return {
    roomId: state.roomId,
    currentPlayer: state.currentPlayer,
    currentTurnStart: state.currentTurnStart,
    isGameStarted: state.isGameStarted,
    isRoundInProgress: state.isRoundInProgress,
    isTurnInProgress: state.isTurnInProgress,
    settings: state.settings,
    scores: state.scores,
    hatWordCount: getHatWordCount(state),
    roundRobinIndex: state.roundRobinIndex,
  };
};
