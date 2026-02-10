import { gql, useQuery, useMutation } from "@apollo/client";
import { useState } from "react";

const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
    }
  }
`;

const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
    }
  }
`;

const Authors = ({ show, token }) => {
  const result = useQuery(ALL_AUTHORS);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [born, setBorn] = useState("");

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!show) return null;
  if (result.loading) return <div>loading...</div>;
  if (result.error) return <div>error: {result.error.message}</div>;

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedAuthor || !born) return;

    await editAuthor({
      variables: { name: selectedAuthor, setBornTo: Number(born) },
    });

    setSelectedAuthor("");
    setBorn("");
  };

  return (
    <div>
      <h2>authors</h2>

      <table>
        <tbody>
          <tr>
            <th>name</th>
            <th>born</th>
            <th>books</th>
          </tr>
          {result.data.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born ?? "—"}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {token && (
        <>
          <h3>Set birthyear</h3>
          <form onSubmit={submit}>
            <div>
              Author
              <select
                value={selectedAuthor}
                onChange={({ target }) => setSelectedAuthor(target.value)}
              >
                <option value="">select author</option>
                {result.data.allAuthors.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              Born
              <input
                type="number"
                value={born}
                onChange={({ target }) => setBorn(target.value)}
              />
            </div>

            <button type="submit" disabled={!selectedAuthor || !born}>
              update author
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Authors;
