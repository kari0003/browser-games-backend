import { Player } from '../player/playerSocketHandler';
import { ChatMessage } from '../chat/chat';

export enum RoomStatus {
  LOBBY = 'lobby',
  INGAME = 'ingame',
  STATS = 'stats',
}

export interface Room {
  name: string;
  id: number;
  status: RoomStatus;
  messages: ChatMessage[];
  players: Player[];
}
