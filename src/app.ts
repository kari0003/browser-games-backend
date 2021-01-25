import { Server, Socket } from 'socket.io';
import { Room } from './platform/room/room';
import { Player } from './platform/connection/connection';

const rooms: { [key: string]: Room } = {};

function socketHandler(socket: Socket) {
  console.log('received connection', socket.id);
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

export function createSocketServer(server: any) {
  const io = new Server(server, { cors: { origin: ['http://localhost:3000', 'https://parasztactivity.vercel.app'], methods: ['GET', 'POST'], credentials: true }});
  
  io.on('connection', socketHandler);
}
