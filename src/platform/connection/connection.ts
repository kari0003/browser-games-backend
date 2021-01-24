import { Socket } from 'socket.io';

export class Player {
  constructor(public readonly socket: Socket) {}

  public disconnect() {
    console.log('disconnected');
  }
}
