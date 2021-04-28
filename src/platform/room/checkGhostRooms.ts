import { db, get, removeRoom } from '../db/db';
import { GameLoop } from '../game/gameLoop';
import { Room } from './room';

export const checkGhostRooms = (gameLoop: GameLoop) => {
  const rooms = get<Room[]>('/rooms');
  rooms.forEach((room) => {
    const atLeastOnePlayerConnected = room.players.reduce((acc, player) => {
      try {
        const existingPlayer = get(`/players/${player.id}`);
        return !!existingPlayer || acc;
      } catch {
        return acc;
      }
    }, false);
    if (!atLeastOnePlayerConnected) {
      console.log('no players connected to room:', room);
      removeRoom(room.id, gameLoop);
    }
  });
};
