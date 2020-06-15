import { createServer } from 'http';
import SocketIo from 'socket.io';
import { config } from './config';
import { Room } from './platform/room/room';

const rooms: { [key: string]: Room } = {};

export function getSocketServer() {
  const io = SocketIo();

  io.on('connection', (s) => {
    s.on('createRoom', (socketId: string) => {
      console.log('adasdasdfasdfsdfasdfasdfasdfas');
      const room = new Room(socketId);

      rooms[room.id] = room;

      room.join(socketId);
      s.join(room.id);

      s.emit('joinRoomSuccess', room.id);
    });

    s.on('joinRoom', (socketId: string, roomId: string) => {
      const room = rooms[roomId];
      if (!room) {
        s.emit('joinRoomFailed', `No such room with id ${roomId}`);
        return;
      }
      room.join(socketId);
      s.emit('joinRoomSuccess', roomId);
      io.to(room.id).send('playerJoin', socketId);
    });

    s.on('nudgeRoom', (roomId: string) => {
      const room = rooms[roomId];
      if (!room) {
        s.emit('nudgeFailed', `No such room with id ${roomId}`);
        return;
      }
      s.to(room.id).send('nudge', room.connections);
    });
  });

  return io;
}
