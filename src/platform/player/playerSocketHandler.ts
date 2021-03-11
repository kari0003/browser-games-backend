import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { set, get } from '../db/db';

export interface Player {
  id: string;
  name: string;
  lastUpdated: Date;
}

const findPlayer = (id: string): Player => {
  return get<Player>(`/players/${id}`, new UserError('playerNotFound', `No player with id ${id}`));
};

export const upsertPlayerHandler: Handler<{ name?: string }> = (s, { name }) => {
  const player = { id: s.id, name, lastUpdated: new Date() };
  set(`/players/${s.id}`, player);

  s.emit('profileReply', player);
};

export const getPlayerHandler: Handler<null> = (s) => {
  const player = findPlayer(s.id);

  s.emit('profileReply', player);
};
