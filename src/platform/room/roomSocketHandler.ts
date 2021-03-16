import { Socket } from 'socket.io';
import { joinChannel, leaveChannel } from '../../socket.handler';
import { get, getRoomByName, getRooms, pushRoom, removeRoom, set } from '../db/db';
import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { Room, RoomStatus } from './room';

export const getRoomChannel = (room: Room): string => {
  return `room_${room.id}`;
};

const findRoom = (roomName: string): Room => {
  const room = getRoomByName(roomName);
  if (!room) {
    throw new UserError('roomNotFound', `No such room with id ${roomName}`);
  }
  return room;
};

const broadcastRoomUpdate = (s: Socket, room: Room) => {
  const upToDateRoom = get(`/rooms[${room.id}]`);
  console.log('updateRoom', getRoomChannel(room), { room: upToDateRoom });
  s.to(getRoomChannel(room)).emit('updateRoom', { room: upToDateRoom });
};

export const createRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const id = getRooms().length;

  const existingRoom = getRoomByName(roomName);
  if (existingRoom) {
    joinRoomHandler(s, { roomName: existingRoom.name });
    return;
  }

  const room: Room = { name: roomName, id, status: RoomStatus.LOBBY, messages: [], players: [get(`/players/${s.id}`)] };
  pushRoom(room);

  set(`/rooms[${room.id}]`, { ...room, players: [...room.players, get(`/players/${s.id}`)] });
  joinChannel(s, getRoomChannel(room), { room });
};

export const leaveRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  set(`/rooms[${room.id}]`, { ...room, players: [...room.players.filter((p) => p.id !== s.id)] });
  console.log('set players to', get(`/rooms/${room.id}/players`));
  leaveChannel(s, getRoomChannel(room), {});
  broadcastRoomUpdate(s, room);

  console.log('find room after:', findRoom(roomName));

  if ((room.players.length = 0)) {
    removeRoom(room.id);
  }
};

export const joinRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  const player = get(`/players/${s.id}`, new UserError('playerNotFound', 'Set Player Profile first!'));

  console.log(room, player, [...room.players, player]);
  set(`/rooms/${room.id}/players`, [...room.players, player]);
  joinChannel(s, getRoomChannel(room), { room });
  broadcastRoomUpdate(s, room);
};
