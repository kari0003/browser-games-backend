import { Socket } from 'socket.io';
import { Player } from './platform/connection/connection';
import { getRoomByName, getRooms, set } from './platform/db/db';
import { registerSocketHandlerFactory } from './platform/socketHandler/registerSocketHandler';
import { createRoomHandler, joinRoomHandler, leaveRoomHandler } from './platform/room/roomSocketHandler';

export function joinChannel(socket: Socket, channel: string, replyPayload: unknown) {
  console.log(`joined s ${socket.id} to ${channel}`);
  socket.join(channel);
  socket.emit('joinChannelReply', replyPayload);
}

export function leaveChannel(socket: Socket, channel: string, replyPayload: unknown) {
  socket.leave(channel);
  console.log(`left s ${socket.id} from ${channel}`);
  socket.emit('leaveChannelReply', replyPayload);
}

export function socketHandler(socket: Socket) {
  console.log('received connection', socket.id);
  const player = new Player(socket);

  const s = socket;

  const register = registerSocketHandlerFactory(s);

  register('createRoom', createRoomHandler);
  register('leaveRoom', leaveRoomHandler);
  register('joinRoom', joinRoomHandler);

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
