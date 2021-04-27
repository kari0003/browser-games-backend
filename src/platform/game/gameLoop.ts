import { GameState } from '../../parasztactivity/gameState';
import { get } from '../db/db';
import { Server } from 'socket.io';
import { parasztactivityLoopHandlerFactory } from '../../parasztactivity/eventHandler';

export type GameLoop = {
  register(id: string, gameHanlder: () => void): void;
  remove(id: string): void;
  stop(): void;
};

export const gameLoopFactory = (timeout: number = 1000): GameLoop => {
  const handlers: Record<string, () => void> = {};

  const loop = setInterval(() => {
    Object.values(handlers).forEach((handler) => handler());
  }, timeout);

  return {
    register: (id: string, handler: () => void) => {
      if (handlers[id]) {
        console.log('WARNING OVERWRITING HANDLER');
      }
      handlers[id] = handler;
    },
    remove: (id: string) => {
      if (!handlers[id]) {
        console.log('WARNING GAMELOOP NOT FOUND');
      }
      delete handlers[id];
    },
    stop: () => {
      clearInterval(loop);
    },
  };
};

export const initGameLoop = (io: Server): GameLoop => {
  const gameLoop = gameLoopFactory();
  const games = get<Record<string, GameState>>(`/games`); // TODO parasztactivity specific
  Object.keys(games).map(([roomId]) => {
    console.log('registering loophandler to ', roomId);
    gameLoop.register(roomId, parasztactivityLoopHandlerFactory(Number.parseInt(roomId), io));
  });
  return gameLoop;
};
