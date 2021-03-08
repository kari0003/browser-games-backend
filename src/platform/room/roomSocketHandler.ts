import { joinChannel, leaveChannel } from '../../socket.handler';
import { get, getRoomByName, getRooms, pushRoom, removeRoom, set } from '../db/db';
import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { Room, RoomStatus } from './room';

const getRoomChannel = (room: Room): string => {
  return `room_${room.id}`;
};

const findRoom = (roomName: string): Room => {
  const room = getRoomByName(roomName);
  if (!room) {
    throw new UserError('roomNotFound', `No such room with id ${roomName}`);
  }
  return room;
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

  set(`/rooms/${room.id}/players`, [...room.players, get(`/players/${s.id}`)]);
  joinChannel(s, getRoomChannel(room), { room });
};

export const leaveRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  set(`/rooms/${room.id}/players`, [...room.players.filter((p) => p.id !== s.id)]);
  console.log(get(`/rooms/${room.id}/players`));
  leaveChannel(s, getRoomChannel(room), {});

  if ((room.players.length = 0)) {
    removeRoom(room.id);
  }
};

export const joinRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  console.log('room join', room, get(`/players/${s.id}`));
  set(`/rooms/${room.id}/players`, [...room.players, get(`/players/${s.id}`)]);
  joinChannel(s, getRoomChannel(room), { room });
};
