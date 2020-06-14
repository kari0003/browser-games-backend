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
});

convictConfig.validate({ allowed: 'strict' });

export const config = convictConfig.getProperties();
