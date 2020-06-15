import { createServer } from 'http';
import SocketIo from 'socket.io';
import { config } from './config';

export function getSocketServer() {
  const server = createServer();
  const io = SocketIo(server);

  io.on('connection', () => {
    console.log('a user connected');
  });

  return server;
}
