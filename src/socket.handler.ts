import { Socket } from 'socket.io';
import { Player } from './platform/connection/connection';
import { getRoomByName, getRooms, pushRoom } from './platform/db/db';
import { Room, RoomStatus } from './platform/room/room';

export function socketHandler(socket: Socket) {
  console.log('received connection', socket.id);
  const player = new Player(socket);

  const s = socket;
  s.on('createRoom', (roomName: string) => {
    const id = getRooms().length;
    const room: Room = { name: roomName, id, status: RoomStatus.LOBBY };

    pushRoom(room);

    // room.addPlayer(player);
  });

  s.on('leaveRoom', (roomName: string) => {});

  s.on('nudgeRoom', (roomName: string) => {
    const room = getRoomByName(roomName);
    if (!room) {
      s.emit('nudgeFailed', `No such room with id ${roomName}`);
      return;
    }
    s.to(`room_${room.id}`).emit('nudge', room.status);
  });

  s.on('chatMessage', (chatMessage: { name: string; message: string }) => {
    console.log('recevied message lol');
    s.emit('chatMessage', chatMessage);
  });

  s.on('listRooms', () => {
    const rooms = getRooms();
    s.emit('listRoomsReply', rooms);
  });
}
