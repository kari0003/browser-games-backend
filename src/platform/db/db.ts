import { Room } from '../room/room';
import { JsonDB } from 'node-json-db';
import { config } from '../../config';

export const db = new JsonDB(config.dbPath, true, true);

export function getRooms(): Room[] {
  return db.getData('/rooms');
}

export function getRoom(id: number): Room | undefined {
  return db.getData(`/rooms[${id}]`);
}

export function getRoomByName(name: string): Room | undefined {
  return getRooms()
    .filter((room) => room.name === name)
    .reduce<Room | undefined>((firstRoom, room) => {
      return firstRoom || room;
    }, undefined);
}

export function pushRoom(room: Room) {
  return db.push('/rooms[]', room, true);
}

export function removeRoom(id: number) {
  console.log('deleting room');
  try {
    db.delete(`/games/${id}`);
  } catch (error) {
    console.log('could not delete game', error);
  }
  return db.delete(`/rooms[${id}]`);
}

export function set<T>(path: string, value: T) {
  db.push(path, value, true);
}

export function get<T>(path: string, error?: Error): T {
  try {
    return db.getData(path);
  } catch (err) {
    console.error('dbGetError', err.message);
    if (error) {
      throw error;
    }
    throw err;
  }
}
