import { v4 } from 'uuid';

export class Connection {
  constructor(public readonly id = v4()) {}

  public disconnect() {
    console.log('disconnected');
  }
}
