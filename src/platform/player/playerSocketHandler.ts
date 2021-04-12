import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { set, get, db } from '../db/db';
import { v4 } from 'uuid';

export interface Player {
  id: string;
  token: string;
  name: string;
  lastUpdated: Date;
  sockets: string[];
}

const findPlayer = (id: string): Player => {
  return get<Player>(`/players/${id}`, new UserError('playerNotFound', `No player with id ${id}`));
};

export const removePlayer = (id: string): void => {
  return db.delete(`/players/${id}`);
};

export const registerPlayerAndSocket = (socketId: string, token: string | undefined) => {
  const newToken = token || v4().slice(0, 8);
  try {
    const existingPlayer = get<Player>(`/players/${newToken}`);
    if (existingPlayer) {
      db.push(`/players/${newToken}`, { ...existingPlayer, sockets: [...existingPlayer.sockets, socketId] });
      console.log(`registered new socket ${socketId} for ${newToken}`);
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

export const handshakeHandler: Handler<{ token?: string }> = (s, { token }) => {
  console.log('handshaking', s.id);
  const socketId = s.id;
  const responseToken = registerPlayerAndSocket(socketId, token);
  s.emit('handshakeReply', { token: responseToken });
};
