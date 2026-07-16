import express from "express";
import router from "./routes/router";
import "./auth/passport-local";
import { ConnectDB } from "./libs/mongoose";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { expressMiddleware } from "@as-integrations/express4";
import bodyParser from "body-parser";
import { corsMiddleware } from "./middleware/cors";
import { sessionMiddleware } from "./middleware/session";
import { expressJsonMiddleware } from "./middleware/express-json";
import {
  passportInitializeMiddleware,
  passportSessionMiddleware,
} from "./middleware/passport";
import { typeDefs } from "@/graphql/types";
import { resolvers } from "@/graphql/resolvers";
import type { Context, ContextUser } from "@/types/graphql-context";

const app = express();
dotenv.config({ path: "../.env" });

ConnectDB().catch((err) => {
  console.error(err);
  process.exit(1);
});

const PORT = Bun.env.PORT || 3000;

app.use(corsMiddleware);
app.use(expressJsonMiddleware);
app.use(sessionMiddleware);
app.use(passportInitializeMiddleware);
app.use(passportSessionMiddleware);
app.use(router);

const httpServer = http.createServer(app);

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
  "/api/graphql",
  corsMiddleware,
  express.json(),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      return { user: req.user as ContextUser | undefined };
    },
  }),
);

app.listen(PORT);
