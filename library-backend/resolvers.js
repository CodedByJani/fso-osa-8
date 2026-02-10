import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PubSub } from "graphql-subscriptions";

import { Book } from "./models/book.js";
import { Author } from "./models/author.js";
import { User } from "./models/user.js";
import { JWT_SECRET } from "./utils/config.js";

const pubsub = new PubSub();
const BOOK_ADDED = "BOOK_ADDED";

export const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),

    allBooks: async (root, args) => {
      let query = {};

      if (args.genre) {
        query.genres = { $in: [args.genre] };
      }

      const books = await Book.find(query).populate("author");

      if (args.author) {
        return books.filter((b) => b.author.name === args.author);
      }

      return books;
    },

    allAuthors: async () => {
      const authors = await Author.find({});
      const books = await Book.find({});

      return authors.map((a) => ({
        ...a.toObject(),
        bookCount: books.filter((b) => b.author.toString() === a._id.toString())
          .length,
      }));
    },

    me: (root, args, context) => context.currentUser,
  },

  Mutation: {
    createUser: async (root, args) => {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);

      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
        passwordHash,
      });

      try {
        return await user.save();
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args,
          },
        });
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      const passwordCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.passwordHash);

      if (!user || !passwordCorrect) {
        throw new GraphQLError("wrong credentials", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return {
        value: jwt.sign(userForToken, JWT_SECRET),
      };
    },

    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      let author = await Author.findOne({ name: args.author });
      if (!author) {
        author = new Author({ name: args.author });
        await author.save();
      }

      const book = new Book({ ...args, author: author._id });

      try {
        await book.save();
        const populatedBook = await book.populate("author");

        // julkaistaan subscription
        context.pubsub.publish(BOOK_ADDED, {
          bookAdded: populatedBook,
        });

        return populatedBook;
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { code: "BAD_USER_INPUT", invalidArgs: args },
        });
      }
    },

    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const author = await Author.findOne({ name: args.name });
      if (!author) return null;

      author.born = args.setBornTo;
      return author.save();
    },
  },

  Subscription: {
    bookAdded: {
      subscribe: (root, args, context) =>
        context.pubsub.asyncIterator(BOOK_ADDED),
    },
  },
};
