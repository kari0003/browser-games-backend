import { Room } from './room';

describe('Room', () => {
  test('should create room with ID', () => {
    const room = new Room('roomId');

    expect(room.id).toBe('roomId');
  });
});
