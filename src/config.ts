import convict from 'convict';
import dotenv from 'dotenv';

dotenv.config();

const convictConfig = convict({
  port: {
    doc: 'The port to bind socket.io server with.',
    format: 'port',
    default: 3000,
    env: 'PORT',
    arg: 'port',
  },
  dbPath: {
    doc: 'json database file path',
    format: String,
    default: 'db.json',
    env: 'DB_PATH',
    arg: 'dbPath',
  },
});

convictConfig.validate({ allowed: 'strict' });

export const config = convictConfig.getProperties();
