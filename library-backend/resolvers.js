const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");

const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const config = require("./utils/config");

const resolvers = {
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

    me: (root, args, context) => {
      return context.currentUser;
    },
  },

  Mutation: {
    createUser: async (root, args) => {
      const user = new User(args);

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

      // kovakoodattu salasana
      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return {
        value: jwt.sign(userForToken, config.JWT_SECRET),
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

      const book = new Book({
        ...args,
        author: author._id,
      });

      try {
        await book.save();
        return book.populate("author");
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args,
          },
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
};

module.exports = resolvers;
