import { Socket } from 'socket.io';

export type Handler<Payload> = (socket: Socket, payload: Payload) => void;

export class UserError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export const registerSocketHandlerFactory = (socket: Socket) => {
  return <T>(message: string, handler: Handler<T>) => {
    socket.on(message, (payload: T) => {
      try {
        return handler(socket, payload);
      } catch (err) {
        if (err instanceof UserError) {
          console.error('UserError', err);
          return socket.emit('error', { errorCode: err.code, errorMessage: err.message });
        }
        console.error(err);
      }
    });
  };
};
