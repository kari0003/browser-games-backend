import { v4 } from 'uuid';
import { Player } from '../connection/connection';
import { Server } from 'socket.io';

export enum RoomStatus {
  LOBBY = 'lobby',
  INGAME = 'ingame',
  STATS = 'stats',
}

export class Room {
  public io: Server;
  public players: Player[] = [];
  public readonly id = 'burkek'; // v4();
  public status = RoomStatus.LOBBY;
  constructor(public host: string) {}

  send(event: string, message: any) {
    this.io.to(this.id).emit(event, message);
  }

  deleteRoom() {
    this.send('deleteRoom', {});
  }

  addPlayer(p: Player) {
    const { socket, ...playerOutput } = p;
    socket.join(this.id);

    this.players.push(p);
    this.send('playerJoin', playerOutput);
  }

  removePlayer(p: Player) {
    const { socket, ...playerOutput } = p;
    socket.leave(this.id);

    this.players = this.players.splice(this.players.indexOf(p), 1);
    this.send('playerLeave', playerOutput);
  }
}
