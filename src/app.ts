import { Server } from 'socket.io';
import { initGameLoop } from './platform/game/gameLoop';
import { checkDisconnectedPlayers } from './platform/player/checkDisconnectedPlayers';
import { checkGhostRooms } from './platform/room/checkGhostRooms';
import { socketHandlerFactory } from './socket.handler';

export function createSocketServer(server: any) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://parasztactivity.vercel.app'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const gameLoop = initGameLoop(io);
  io.on('connection', socketHandlerFactory(io, gameLoop));
  setInterval(() => {
    checkDisconnectedPlayers(io);
    checkGhostRooms(gameLoop);
  }, 10000);
}
