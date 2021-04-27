import { Server, Socket } from 'socket.io';
import { getRoomByName, getRooms, set } from './platform/db/db';
import { registerSocketHandlerFactory } from './platform/socketHandler/registerSocketHandler';
import {
  createRoomHandler,
  joinRoomHandler,
  leaveRoomHandlerFactory,
  getRoomChannel,
} from './platform/room/roomSocketHandler';
import {
  upsertPlayerHandler,
  getPlayerHandler,
  removePlayerSocket,
  handshakeHandler,
} from './platform/player/playerSocketHandler';
import { gameEventHandlerFactory, getGameStateHandler, initGameHandlerFactory } from './platform/game/gameEventHandler';
import { Room } from './platform/room/room';
import { GameLoop } from './platform/game/gameLoop';

export function joinChannel(socket: Socket, channel: string, replyPayload: { room: Room }) {
  console.log(`joined s ${socket.id} to ${channel}`);
  socket.join(channel);
  socket.emit('joinChannelReply', replyPayload);
}

export function leaveChannel(socket: Socket, channel: string, replyPayload: unknown) {
  socket.leave(channel);
  console.log(`left s ${socket.id} from ${channel}`);
  socket.emit('leaveChannelReply', replyPayload);
}

export const socketHandlerFactory = (io: Server, gameLoop: GameLoop) => (socket: Socket) => {
  console.log('received connection', socket.id);
  const s = socket;

  s.on('disconnect', () => {
    console.log('Disconnected ', socket.id);
    removePlayerSocket(socket.id);
  });

  const register = registerSocketHandlerFactory(s);

  register('handshake', handshakeHandler);

  register('setProfile', upsertPlayerHandler);
  register('getProfile', getPlayerHandler);

  register('createRoom', createRoomHandler);
  register('leaveRoom', leaveRoomHandlerFactory(gameLoop));
  register('joinRoom', joinRoomHandler);

  register('initGame', initGameHandlerFactory(io, gameLoop));
  register('gameEvent', gameEventHandlerFactory(io));
  register('getGameState', getGameStateHandler);

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
};
