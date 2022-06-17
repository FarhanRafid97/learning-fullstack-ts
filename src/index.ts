import 'reflect-metadata';

import { COOKIE_NAME, __prod__ } from './constants';

import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import session from 'express-session';
import { createClient } from 'redis';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import cors from 'cors';
import Redis from 'ioredis';
import { createConnection } from 'typeorm';
import { User } from './entities/User';
import { Post } from './entities/Post';

const RedisStore = connectRedis(session);
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);
const redis = new Redis();

const main = async () => {
  const con = await createConnection({
    type: 'postgres',
    database: 'liredit2',
    username: 'farhan_binar',
    password: 'farhan322',
    logging: true,
    synchronize: true,
    entities: [User, Post],
  });

  const app = express();
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: 'keyboard cat',
      resave: false,
    })
  );

  const appolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],

    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  await appolloServer.start();

  appolloServer.applyMiddleware({
    app,
    cors: false,
  });
  app.listen(4000, () => console.log('app listen to localhost:4000'));
};

main().catch((err) => {
  console.log(err);
});
