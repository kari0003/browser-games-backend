import { v4 } from 'uuid';
import { Connection } from '../connection/connection';

export enum RoomStatus {
  LOBBY = 'lobby',
  INGAME = 'ingame',
  STATS = 'stats',
}

export class Room {
  public connections: string[] = [];
  public readonly id = v4();
  public status = RoomStatus.LOBBY;
  constructor(public host: string) {}

  deleteRoom() {
    this.connections.forEach(this.leave);
  }

  join(c: string) {
    this.connections.push(c);
  }

  leave(leaver: string) {
    this.connections.filter((c) => c !== leaver);
  }
}
