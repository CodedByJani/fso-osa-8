import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import typeDefs from "./schema.js";
import { resolvers } from "./resolvers.js";
import { MONGODB_URI, JWT_SECRET } from "./utils/config.js";
import { User } from "./models/user.js";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

// MongoDB-yhteys
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("connected to MongoDB"))
  .catch((err) => console.log("error connecting to MongoDB", err));

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Express ja HTTP-server
const app = express();

// CORS: salli vain frontend
app.use(cors({ origin: "http://localhost:5173" }));

// HTTP-server Expressistä
const httpServer = createServer(app);

// WebSocket server subscriptioneille
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Subscriptionien yhdistäminen
useServer({ schema, context: () => ({ pubsub }) }, wsServer);

// Apollo Server
const server = new ApolloServer({ schema });
await server.start();

// Express middleware Apollo Serverille
app.use(
  "/graphql",
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const auth = req?.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
        const currentUser = await User.findById(decodedToken.id);
        return { currentUser, pubsub };
      }
      return { pubsub };
    },
  }),
);

// Start server
httpServer.listen(4000, () => {
  console.log(`Server ready at http://localhost:4000/graphql`);
  console.log(`Subscriptions ready at ws://localhost:4000/graphql`);
});
