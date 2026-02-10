import { gql, useQuery, useSubscription } from "@apollo/client";
import { useState, useEffect } from "react";

const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      id
      title
      published
      author {
        name
      }
      genres
    }
  }
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      id
      title
      published
      genres
      author {
        name
      }
    }
  }
`;

const Books = ({ show }) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [books, setBooks] = useState([]);

  const { loading, error, data, client } = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data?.allBooks) {
      setBooks(data.allBooks);
    }
  }, [data]);

  useSubscription(BOOK_ADDED, {
    onData: ({ data: subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded;

      if (!books.find((b) => b.id === addedBook.id)) {
        const dataInStore = client.readQuery({
          query: ALL_BOOKS,
          variables: { genre: selectedGenre },
        });

        client.writeQuery({
          query: ALL_BOOKS,
          variables: { genre: selectedGenre },
          data: {
            allBooks: dataInStore
              ? dataInStore.allBooks.concat(addedBook)
              : [addedBook],
          },
        });

        setBooks((prev) => prev.concat(addedBook));
      }
    },
  });

  if (!show) return null;
  if (loading) return <div>loading...</div>;
  if (error) return <div>error: {error.message}</div>;

  const allGenres = Array.from(new Set(books.flatMap((b) => b.genres || [])));

  return (
    <div>
      <h2>books</h2>

      <div>
        Filter by genre:{" "}
        {allGenres.map((g) => (
          <button key={g} onClick={() => setSelectedGenre(g)}>
            {g}
          </button>
        ))}
        <button onClick={() => setSelectedGenre(null)}>all genres</button>
      </div>

      <table>
        <tbody>
          <tr>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>

          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author ? book.author.name : "Unknown"}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Books;
