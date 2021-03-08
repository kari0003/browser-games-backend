import { Player } from '../player/playerSocketHandler';

export enum RoomStatus {
  LOBBY = 'lobby',
  INGAME = 'ingame',
  STATS = 'stats',
}

export type ChatMessage = { name: string; message: string };

export interface Room {
  name: string;
  id: number;
  status: RoomStatus;
  messages: ChatMessage[];
  players: Player[];
}

// export class Room {
//   public players: Player[] = [];
//   public id = 'burkek'; // v4();
//   public status = RoomStatus.LOBBY;
//   constructor(public name: string) {}

//   send(event: string, message: any) {
//     this.io.to(this.id).emit(event, message);
//   }

//   deleteRoom() {
//     this.send('deleteRoom', {});
//   }

//   addPlayer(p: Player) {
//     const { socket, ...playerOutput } = p;
//     socket.join(this.id);

//     this.players.push(p);
//     this.send('playerJoin', playerOutput);
//   }

//   removePlayer(p: Player) {
//     const { socket, ...playerOutput } = p;
//     socket.leave(this.id);

//     this.players = this.players.splice(this.players.indexOf(p), 1);
//     this.send('playerLeave', playerOutput);
//   }
// }
