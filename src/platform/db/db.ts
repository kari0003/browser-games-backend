import { Player } from '../connection/connection';
import { Room } from '../room/room';
import { JsonDB } from 'node-json-db';

const JSON_DB_FILE = 'localDB';

export type DBSchema = {
  players: Player[];
  rooms: Room[];
};

const db = new JsonDB(JSON_DB_FILE, true, true);

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

export function set(path: string, value: unknown) {
  db.push(path, value, true);
}

export function get(path: string): unknown {
  return db.getData(path);
}
