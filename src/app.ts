import { createServer } from 'http';
import SocketIo from 'socket.io';
import { config } from './config';

export function getSocketServer() {
  const port = config.port;

  const server = createServer();
  const io = SocketIo(server);

  io.on('connection', () => {
    console.log('a user connected');
  });

  server.listen(port, () => {
    console.log('listening on ', port);
  });

  return server;
}
