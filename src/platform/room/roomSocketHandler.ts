import { joinChannel, leaveChannel } from '../../socket.handler';
import { getRoomByName, getRooms, pushRoom } from '../db/db';
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
    console.log('found existing room', roomName);

    joinChannel(s, getRoomChannel(existingRoom), { room: existingRoom });
    return;
  }

  const room: Room = { name: roomName, id, status: RoomStatus.LOBBY, messages: [] };
  pushRoom(room);

  joinChannel(s, getRoomChannel(room), { room });
};

export const leaveRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  leaveChannel(s, getRoomChannel(room), {});

  // TODO DeleteRoom
  // if( room.players.length = 0) {
  // }
};

export const joinRoomHandler: Handler<{ roomName: string }> = (s, { roomName }) => {
  const room = findRoom(roomName);

  joinChannel(s, getRoomChannel(room), { room });
};
