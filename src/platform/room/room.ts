import { v4 } from 'uuid';
import { Connection } from '../connection/connection';

export enum RoomStatus {
  LOBBY = 'lobby',
  INGAME = 'ingame',
  STATS = 'stats',
}

export class Room {
  public connections: Connection[] = [];
  constructor(public readonly id = v4(), public status = RoomStatus.LOBBY) {}

  deleteRoom() {
    this.connections.forEach(this.leave);
  }

  join(c: Connection) {
    this.connections.push(c);
  }

  leave(leaver: Connection) {
    this.connections.map((c) => {
      if (c.id === leaver.id) {
        c.disconnect();
      }
    });
  }
}
