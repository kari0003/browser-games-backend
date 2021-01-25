import { createSocketServer } from './app';
import { config } from './config';
import express from 'express';
import cors from 'cors';

const INDEX = '/index.html';

export const main = () => {
  
  const httpServer = express()
    .use(cors({ origin: '*', methods: ['GET', 'POST']}))
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .use('/status', (req, res) => res.send({ status: 'ok'}))
    .listen(config.port, () => console.log(`Listening on ${config.port}`));
  
  createSocketServer(httpServer);
};

// Run main if its the entry point
if (!module.parent) {
  main();
}
