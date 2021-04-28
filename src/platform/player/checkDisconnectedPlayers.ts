import { Server } from 'socket.io';
import { db, get } from '../db/db';
import { Player } from './playerSocketHandler';

export const isPlayerConnected = (io: Server, player: Player): boolean => {
  const isConnected = player.sockets.reduce<boolean>((acc, socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    return acc || !!socket?.connected;
  }, false);
  console.log('player', player.id, 'isConnected', isConnected);
  return isConnected;
};

export const checkDisconnectedPlayers = (io: Server) => {
  const players = get<Record<string, Player>>('/players');
  Object.values(players).forEach((player) => {
    const isConnected = isPlayerConnected(io, player);
    if (!isConnected) {
      db.delete(`/players/${player.id}`);
    }
  });
  return;
};
