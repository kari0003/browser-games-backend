import { Socket } from 'socket.io';
import { Player } from './platform/connection/connection';
import { getRoomByName, getRooms, pushRoom, set } from './platform/db/db';
import { Room, RoomStatus } from './platform/room/room';

export function socketHandler(socket: Socket) {
  console.log('received connection', socket.id);
  const player = new Player(socket);

  const s = socket;
  s.on('createRoom', (roomName: string) => {
    const id = getRooms().length;

    const existingRoom = getRoomByName(roomName);
    if (existingRoom) {
      console.log('found existing room', roomName);

      s.join(`room_${existingRoom.id}`);
      console.log(`joined s ${s.id} to ${existingRoom.id}`);
      s.emit('joinRoomReply', { room: existingRoom });
      return;
    }

    const room: Room = { name: roomName, id, status: RoomStatus.LOBBY, messages: [] };
    pushRoom(room);

    s.join(`room_${room.id}`);
    console.log(`joined s ${s.id} to ${room.id}`);
    s.emit('joinRoomReply', { room });
  });

  s.on('leaveRoom', (roomName: string) => {
    const room = getRoomByName(roomName);
    if (!room) {
      console.log('couldnt find room', roomName);
      s.emit('roomNotFound', `No such room with id ${roomName}`);
      return;
    }

    s.leave(`room_${room.id}`);
    console.log(`left s ${s.id} from ${room.id}`);
  });

  s.on('nudgeRoom', (roomName: string) => {
    const room = getRoomByName(roomName);
    if (!room) {
      console.log('couldnt find room', roomName);
      s.emit('roomNotFound', `No such room with id ${roomName}`);
      return;
    }
    s.to(`room_${room.id}`).emit('nudge', room.status);
  });

  s.on('joinRoom', (payload: { roomName: string }) => {
    const room = getRoomByName(payload.roomName);
    if (!room) {
      console.log('couldnt find room', payload);
      s.emit('roomNotFound', `No such room with id ${payload.roomName}`);
      return;
    }

    s.join(`room_${room.id}`);
    console.log(`joined s ${s.id} to ${room.id}`);
    s.emit('joinRoomReply', { room });
  });

  s.on('chatMessage', (payload: { roomName: string; chatMessage: { name: string; message: string } }) => {
    const room = getRoomByName(payload.roomName);
    if (!room) {
      console.log('couldnt find room', payload);
      s.emit('roomNotFound', `No such room with id ${payload.roomName}`);
      return;
    }

    set(`/rooms/${room.id}/messages`, [...room.messages, payload.chatMessage]);

    s.nsp.to(`room_${room.id}`).emit('chatMessageOut', payload.chatMessage);
  });

  s.on('listRooms', () => {
    const rooms = getRooms();
    s.emit('listRoomsReply', rooms);
  });
}
