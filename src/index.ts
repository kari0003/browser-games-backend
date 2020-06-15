import { getSocketServer } from './app';
import { config } from './config';

export const main = () => {
  const server = getSocketServer();

  server.listen(config.port);
};

// Run main if its the entry point
if (!module.parent) {
  main();
}
