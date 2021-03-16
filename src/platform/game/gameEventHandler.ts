import { Handler, UserError } from '../socketHandler/registerSocketHandler';
import { parasztactivityEventHandler } from '../../parasztactivity/eventHandler';

export interface GameEvent {
  game: string;
  eventType: string;
  roomId: string;
  payload: unknown;
}

export const upsertPlayerHandler: Handler<{ gameEvent: GameEvent }> = (s, { gameEvent }) => {
  if (gameEvent.game === 'parasztactivity') {
    return parasztactivityEventHandler(s, gameEvent);
  }

  console.log('could not find game for event:', gameEvent);
  throw new UserError('gameNotFound', 'Could not find the game you try to interact with!');
};
