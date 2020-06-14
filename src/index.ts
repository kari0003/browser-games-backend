import { getSocketServer } from './app';

export const main = () => {
  getSocketServer();
};

// Run main if its the entry point
if (!module.parent) {
  main();
}
