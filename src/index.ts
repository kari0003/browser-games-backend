import { createSocketServer } from './app';
import { config } from './config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import resolvers from './platform/graphql/resolvers';
import typedefs from './platform/graphql/typedefs';

const INDEX = '/index.html';
const throwGlobal = (err: Error) => {
  throw err;
};

export const main = async (): Promise<void> => {
  const app = express();
  const apolloServer = new ApolloServer({
    typeDefs: typedefs,
    resolvers: resolvers,
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const httpServer = app
    .use(cors({ origin: '*', methods: ['GET', 'POST'] }))
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .use('/status', (req, res) => res.send({ status: 'ok' }))
    .listen(config.port, () => console.log(`Listening on ${config.port}`));

  createSocketServer(httpServer);
};

// Run main if its the entry point
if (!module.parent) {
  main().catch((err) => throwGlobal(err));
}
