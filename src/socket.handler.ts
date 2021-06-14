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
import { chatMessageHandlerFactory } from './platform/chat/chatHandler';
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

  register('chatMessage', chatMessageHandlerFactory(io));

  s.on('drawDot', (payload) => {
    s.broadcast.emit('drawDot', payload);
  });
  s.on('drawLine', (payload) => {
    s.broadcast.emit('drawLine', payload);
  });
  s.on('clear', (payload) => {
    s.broadcast.emit('clear', payload);
  });

  s.on('listRooms', () => {
    const rooms = getRooms();
    s.emit('listRoomsReply', rooms);
  });
};
