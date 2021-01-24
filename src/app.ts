import { createServer } from 'http';
import SocketIo, { Socket } from 'socket.io';
import { config } from './config';
import { Room } from './platform/room/room';
import { Player } from './platform/connection/connection';

const rooms: { [key: string]: Room } = {};

function socketHandler(socket: Socket) {
  const player = new Player(socket);

  const s = socket;
  s.on('createRoom', (roomName: string) => {
    const room = new Room(roomName);

    rooms[room.id] = room;

    room.addPlayer(player);
  });

  s.on('leaveRoom', (roomName: string) => {});

  s.on('nudgeRoom', (roomName: string) => {
    const room = rooms[roomName];
    if (!room) {
      s.emit('nudgeFailed', `No such room with id ${roomName}`);
      return;
    }
    s.to(room.id).emit('nudge', room.status);
  });
}

export function getSocketServer() {
  const io = SocketIo();

  io.on('connection', socketHandler);

  return io;
}
