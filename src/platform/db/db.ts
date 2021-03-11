import { Player } from '../connection/connection';
import { Room } from '../room/room';
import { JsonDB } from 'node-json-db';
import { config } from '../../config';

export type DBSchema = {
  players: Player[];
  rooms: Room[];
};

const db = new JsonDB(config.dbPath, true, true);

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
