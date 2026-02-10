import { gql, useQuery } from "@apollo/client";

const ME = gql`
  query {
    me {
      favoriteGenre
    }
  }
`;

const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      id
      title
      author {
        name
      }
      published
    }
  }
`;

const Recommended = ({ show }) => {
  const meResult = useQuery(ME);

  const favoriteGenre = meResult.data?.me?.favoriteGenre;

  const booksResult = useQuery(ALL_BOOKS, {
    skip: !favoriteGenre,
    variables: { genre: favoriteGenre },
  });

  if (!show) return null;
  if (meResult.loading || (favoriteGenre && booksResult.loading))
    return <div>loading...</div>;
  if (meResult.error) return <div>Error: {meResult.error.message}</div>;
  if (booksResult.error) return <div>Error: {booksResult.error.message}</div>;

  const books = booksResult.data?.allBooks || [];

  return (
    <div>
      <h2>recommendations</h2>

      <p>
        books in your favorite genre <strong>{favoriteGenre}</strong>
      </p>

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
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommended;
