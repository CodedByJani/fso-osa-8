const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const config = require("./utils/config");
const User = require("./models/user");

mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log("connected to MongoDB"))
  .catch((err) => console.log("error connecting to MongoDB", err));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const auth = req?.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), config.JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
    return {};
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
