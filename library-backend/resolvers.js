const { GraphQLError } = require("graphql");
const Author = require("./models/author");
const Book = require("./models/book");

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments({}),
    authorCount: async () => Author.countDocuments({}),

    allBooks: async (root, args) => {
      let filter = {};

      if (args.author) {
        const author = await Author.findOne({ name: args.author });
        if (!author) return [];
        filter.author = author._id;
      }

      if (args.genre) {
        filter.genres = { $in: [args.genre] };
      }

      return Book.find(filter).populate("author");
    },

    allAuthors: async () => {
      const authors = await Author.find({});
      const books = await Book.find({});

      return authors.map((author) => ({
        name: author.name,
        born: author.born,
        bookCount: books.filter(
          (book) => book.author.toString() === author._id.toString(),
        ).length,
      }));
    },
  },

  Mutation: {
    addBook: async (root, args) => {
      try {
        let author = await Author.findOne({ name: args.author });

        if (!author) {
          author = new Author({ name: args.author });
          await author.save();
        }

        const book = new Book({
          title: args.title,
          published: args.published,
          genres: args.genres,
          author: author._id,
        });

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

    editAuthor: async (root, args) => {
      try {
        const author = await Author.findOne({ name: args.name });
        if (!author) return null;

        author.born = args.setBornTo;
        await author.save();
        return author;
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args,
          },
        });
      }
    },
  },
};

module.exports = resolvers;
