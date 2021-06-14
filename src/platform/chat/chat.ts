import { Server } from 'socket.io';
import { getRoomByName, set } from '../db/db';
import { getRoomChannel } from '../room/roomSocketHandler';

export type ChatMessage = { name: string; message: string; type: 'basic' | 'guess' | 'system' };

export const messageSenderFactory = (io: Server) => (roomName: string, chatMessage: ChatMessage) => {
  const room = getRoomByName(roomName);
  if (!room) {
    console.log('Chat Message couldnt find room', roomName);
    throw new Error(`No such room with id ${roomName}`);
  }

  set(`/rooms/${room.id}/messages`, [...room.messages, chatMessage]);

  io.to(getRoomChannel(room)).emit('chatMessageOut', chatMessage);
};
