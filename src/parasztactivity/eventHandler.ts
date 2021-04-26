import { Server, Socket } from 'socket.io';
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

export const parasztactivityLoopHandlerFactory = (roomId: number, io: Server) => (): void => {
  const state = getState(roomId);
  if (state.isTurnInProgress && state.currentTurnStart) {
    const elapsedTime = Date.now() - state.currentTurnStart;
    const elapsedSeconds = elapsedTime / 1000;
    if (elapsedSeconds > state.settings.turnLengthSeconds) {
      console.log('turn over, elapsed:', elapsedSeconds, state.settings.turnLengthSeconds);

      state.currentPlayer = null;
      state.currentTurnStart = null;
      state.isTurnInProgress = false;
      state.previousTurnEnd = Date.now();
      if (state.currentWord) {
        state.hatWords = [...state.hatWords, state.currentWord];
      }
      const newState = { ...state, currentPlayer: null, currentTurnStart: null, isTurnInProgress: false };

      broadcastGameState(io, newState);
      console.log('newState', newState);
      return setState(newState);
    }
  }
  if (!state.isTurnInProgress && state.previousTurnEnd) {
    const elapsedTime = Date.now() - state.previousTurnEnd;
    const elapsedSeconds = elapsedTime / 1000;
    if (elapsedSeconds > state.settings.betweenTurnSeconds) {
      console.log('turn begins now yaay');
      if (state.isTurnInProgress) {
        console.log('illegalAction', 'Turn already started!');
        return;
      }

      const room = get<Room>(`/rooms[${state.roomId}]`);
      state.isTurnInProgress = true;
      state.currentTurnStart = Date.now();

      state.roundRobinIndex = (state.roundRobinIndex + 1) % room.players.length;
      state.currentPlayer = room.players[state.roundRobinIndex].id;

      broadcastGameState(io, state);
      return setState(state);
    }
  }
};

export const getParasztactivityState = (s: Socket, roomId: number) => {
  const state = getState(roomId);
  const gameState = toPublicState(state);
  s.emit('gameState', { gameState });
};

export const broadcastGameState = (io: Server, state: GameState) => {
  const room = getRoom(state.roomId);
  if (!room) {
    console.log('room Not found');
    throw new UserError('roomNotFound', 'room for game does not exist');
  }
  const gameState = toPublicState(state);
  console.log('broadcastGameState', getRoomChannel(room));
  io.to(getRoomChannel(room)).emit('gameState', gameState);
};

export const parasztactivityEventHandler = (io: Server, s: Socket, event: GameEvent) => {
  const state = { ...getState(event.roomId) };

  const room = get<Room>(`/rooms[${state.roomId}]`);
  const player = findPlayerBySocket(s.id);

  if (event.eventType === 'addWord') {
    const payload = event.payload as AddWordPayload;
    state.allWords.push({ submittedBy: payload.playerId, word: payload.word });
    broadcastGameState(io, state);
    return setState(state);
  }

  if (event.eventType === 'drawWord') {
    if (player.id !== state.currentPlayer) {
      throw new UserError('illegalAction', 'you are not the current player!');
    }
    if (state.currentWord) {
      throw new UserError('illegalAction', 'you have already drawn a word!');
    }
    if (state.hatWords.length > 0) {
      console.log('drawing word');
      const index = getRandomId(state.hatWords);
      console.log(index, state.hatWords);
      state.currentWord = state.hatWords[index];
      state.hatWords = state.hatWords.filter((_, id) => id !== index);
      broadcastGameState(io, state);
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
      broadcastGameState(io, state);
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
      broadcastGameState(io, state);
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
    broadcastGameState(io, state);
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
      broadcastGameState(io, state);
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

    broadcastGameState(io, state);
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
    state.previousTurnEnd = Date.now();

    broadcastGameState(io, state);
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

    broadcastGameState(io, state);
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
    previousTurnEnd: state.previousTurnEnd,
    roundRobinIndex: state.roundRobinIndex,
    settings: state.settings,
    scores: state.scores,
    hatWordCount: getHatWordCount(state),
  };
};
