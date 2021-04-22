import { GameState } from '../../parasztactivity/gameState';
import { get } from '../db/db';
import { Server } from 'socket.io';
import { parasztactivityLoopHandlerFactory } from '../../parasztactivity/eventHandler';

export type GameLoop = {
  register(gameHanlder: () => void): void;
  stop(): void;
};

export const gameLoopFactory = (timeout: number = 1000): GameLoop => {
  const handlers: (() => void)[] = [];

  const loop = setInterval(() => {
    handlers.map((handler) => handler());
  }, timeout);

  return {
    register: (handler: () => void) => {
      handlers.push(handler);
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
    gameLoop.register(parasztactivityLoopHandlerFactory(Number.parseInt(roomId), io));
  });
  return gameLoop;
};
