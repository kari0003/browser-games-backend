import { ChatMessage, messageSenderFactory } from './chat';
import { Handler } from '../socketHandler/registerSocketHandler';
import { Server } from 'socket.io';

export const chatMessageHandlerFactory = (io: Server): Handler<{ roomName: string; chatMessage: ChatMessage }> => {
  const sender = messageSenderFactory(io);
  return (s, payload) => {
    try {
      sender(payload.roomName, payload.chatMessage);
    } catch (err) {
      s.emit('roomNotFound', err.message);
    }
  };
};
