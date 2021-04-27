import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import {
  getParasztactivityState,
  parasztactivityEventHandler,
  parasztactivityInitializer,
  parasztactivityLoopHandlerFactory,
} from '../../parasztactivity/eventHandler';
import { Server } from 'socket.io';
import { GameLoop } from './gameLoop';

export interface GameEvent {
  game: string;
  eventType: string;
  roomId: number;
  payload: unknown;
}

export const gameEventHandlerFactory = (io: Server): Handler<{ gameEvent: GameEvent }> => (s, { gameEvent }) => {
  if (gameEvent.game === 'parasztactivity') {
    return parasztactivityEventHandler(io, s, gameEvent);
  }

  console.log('could not find game for event:', gameEvent);
  throw new UserError('gameNotFound', 'Could not find the game you try to interact with!');
};

export const initGameHandlerFactory = (io: Server, gameLoop: GameLoop): Handler<{ game: string; roomId: number }> => (
  s,
  { game, roomId },
) => {
  if (game === 'parasztactivity') {
    parasztactivityInitializer(s, { roomId });
    gameLoop.register(`${roomId}`, parasztactivityLoopHandlerFactory(roomId, io));
    return;
  }
  console.log('could not find game type:', roomId, game);
  throw new UserError('gameTypeNotFound', 'Could not find the game type!');
};

export const getGameStateHandler: Handler<{ game: string; roomId: number }> = (s, { game, roomId }) => {
  if (game === 'parasztactivity') {
    return getParasztactivityState(s, roomId);
  }

  console.log('could not find game type:', roomId, game);
  throw new UserError('gameTypeNotFound', 'Could not find the game type!');
};
