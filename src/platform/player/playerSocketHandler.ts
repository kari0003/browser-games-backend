import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { set, get, db, getRooms } from '../db/db';
import { v4 } from 'uuid';
import { getRoomChannel } from '../room/roomSocketHandler';
import { joinChannel } from '../../socket.handler';
import { Socket } from 'socket.io';

export interface Player {
  id: string;
  name: string;
  lastUpdated: Date;
  sockets: string[];
}

export const findPlayerBySocket = (socketId: string): Player => {
  const players = get<Record<string, Player>>('/players');
  const found = Object.entries(players).find(([_key, value]) => value.sockets.find((sid) => sid === socketId));
  if (!found) {
    throw new UserError('playerNotFound', `No player with socket ${socketId}`);
  }
  const [token, foundPlayer] = found;
  return foundPlayer;
};

export const removePlayerSocket = (socketId: string): void => {
  const players = get<Record<string, Player>>('/players');
  const found = Object.entries(players).find(([_key, value]) => value.sockets.find((sid) => sid === socketId));
  if (!found) {
    return;
  }
  const [token, foundPlayer] = found;
  const newSocketIds = foundPlayer.sockets.filter((sid) => sid === socketId);
  if ((newSocketIds.length = 0)) {
    db.delete(`/players/${token}`);
    return;
  }
  set(`/players/${token}`, { ...foundPlayer, sockets: newSocketIds });
};

export const registerPlayerAndSocket = (socketId: string, token: string | undefined) => {
  const newToken = token || v4().slice(0, 8);
  try {
    const existingPlayer = get<Player>(`/players/${newToken}`);
    if (existingPlayer) {
      if (existingPlayer.sockets.findIndex((savedSocket) => savedSocket === socketId) < 0) {
        db.push(`/players/${newToken}`, { ...existingPlayer, sockets: [...existingPlayer.sockets, socketId] });
        console.log(`registered new socket ${socketId} for ${newToken}`);
      }
      return newToken;
    }
  } catch (err) {
    console.log('cannot find player by token');
  }
  db.push(`/players/${newToken}`, { name: 'Átlagos Józsi', id: newToken, sockets: [socketId] });
  console.log(`registered new socket ${socketId} and new player with: ${newToken}`);
  return newToken;
};

export const upsertPlayerHandler: Handler<{ name?: string }> = (s, { name }) => {
  const players = get<Record<string, Player>>('/players');
  const found = Object.entries(players).find(([_key, value]) => value.sockets.find((sid) => sid === s.id));

  if (!found) {
    throw new UserError('playerNotFound', `No player with id ${s.id}`);
  }
  const [token, foundPlayer] = found;
  const newPlayer = { ...foundPlayer, name };
  set(`/players/${token}`, newPlayer);
  s.emit('profileReply', newPlayer);
};

export const getPlayerHandler: Handler<null> = (s) => {
  const players = get<Record<string, Player>>('/players');
  const found = Object.entries(players).find(([_key, value]) => value.sockets.find((sid) => sid === s.id));
  if (!found) {
    throw new UserError('playerNotFound', `No player with id ${s.id}`);
  }
  s.emit('profileReply', found[1]);
};

export function joinNeededChannels(socket: Socket, token: string): void {
  try {
    const rooms = getRooms();
    rooms.forEach((room) => {
      const pId = room.players.findIndex((p) => p.id === token);
      if (pId > 0) {
        console.log('found room for handshaking player:', token, room.id);
        joinChannel(socket, getRoomChannel(room), { room });
      }
    });
  } catch (err) {
    console.log('did not join needed channels:', err);
  }
}

export const handshakeHandler: Handler<{ token?: string }> = (s, { token }) => {
  console.log('handshaking', s.id);
  const socketId = s.id;
  const responseToken = registerPlayerAndSocket(socketId, token);
  joinNeededChannels(s, responseToken);
  s.emit('handshakeReply', { token: responseToken });
};
