import { Socket } from 'socket.io';
import { joinChannel, leaveChannel } from '../../socket.handler';
import { get, getRoomByName, getRooms, pushRoom, removeRoom, set } from '../db/db';
import { GameLoop } from '../game/gameLoop';
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

export const createRoomHandler: Handler<{ roomName: string; token: string }> = (s, { roomName, token }) => {
  const id = getRooms().length;

  const existingRoom = getRoomByName(roomName);
  if (existingRoom) {
    joinRoomHandler(s, { roomName: existingRoom.name, token });
    return;
  }

  const room: Room = {
    name: roomName,
    id,
    status: RoomStatus.LOBBY,
    messages: [],
    players: [get(`/players/${token}`)],
  };
  pushRoom(room);

  // Tell that room was actually created
  s.emit('createRoomReply', { room });

  joinChannel(s, getRoomChannel(room), { room });
};

export const leaveRoomHandlerFactory = (gameLoop: GameLoop): Handler<{ roomName: string; token: string }> => (
  s,
  { roomName, token },
) => {
  const room = findRoom(roomName);

  const newPlayerList = [...room.players.filter((p) => p.id !== token)];

  set(`/rooms[${room.id}]`, { ...room, players: newPlayerList });
  console.log('set players to', get(`/rooms/${room.id}/players`));
  leaveChannel(s, getRoomChannel(room), {});
  broadcastRoomUpdate(s, room);

  if (newPlayerList.length == 0) {
    removeRoom(room.id, gameLoop);
  }
};

export const joinRoomHandler: Handler<{ roomName: string; token: string }> = (s, { roomName, token }) => {
  const room = findRoom(roomName);

  const player = get(`/players/${token}`, new UserError('playerNotFound', 'Set Player Profile first!'));

  console.log('join room', room, player);
  set(`/rooms/${room.id}/players`, [...room.players, player]);
  joinChannel(s, getRoomChannel(room), { room });
  broadcastRoomUpdate(s, room);
};
