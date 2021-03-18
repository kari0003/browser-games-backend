import { Socket } from 'socket.io';
import { getRoomByName, getRooms, set } from './platform/db/db';
import { registerSocketHandlerFactory } from './platform/socketHandler/registerSocketHandler';
import {
  createRoomHandler,
  joinRoomHandler,
  leaveRoomHandler,
  getRoomChannel,
} from './platform/room/roomSocketHandler';
import { upsertPlayerHandler, getPlayerHandler } from './platform/player/playerSocketHandler';
import { gameEventHandler, initGameHandler } from './platform/game/gameEventHandler';

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
  const s = socket;

  const register = registerSocketHandlerFactory(s);

  register('createRoom', createRoomHandler);
  register('leaveRoom', leaveRoomHandler);
  register('joinRoom', joinRoomHandler);

  register('setProfile', upsertPlayerHandler);
  register('getProfile', getPlayerHandler);

  register('initGame', initGameHandler);
  register('gameEvent', gameEventHandler);

  s.on('chatMessage', (payload: { roomName: string; chatMessage: { name: string; message: string } }) => {
    const room = getRoomByName(payload.roomName);
    if (!room) {
      console.log('couldnt find room', payload);
      s.emit('roomNotFound', `No such room with id ${payload.roomName}`);
      return;
    }

    set(`/rooms/${room.id}/messages`, [...room.messages, payload.chatMessage]);

    s.nsp.to(getRoomChannel(room)).emit('chatMessageOut', payload.chatMessage);
  });

  s.on('listRooms', () => {
    const rooms = getRooms();
    s.emit('listRoomsReply', rooms);
  });
}
