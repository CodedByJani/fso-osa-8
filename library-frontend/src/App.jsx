import { useState, useEffect } from "react";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Login from "./components/Login";
import Recommended from "./components/Recommended";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [booksCache, setBooksCache] = useState([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("library-user-token");
    if (savedToken) setToken(savedToken);
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.removeItem("library-user-token");
    setPage("authors");
  };

  const updateCacheWith = (addedBook) => {
    setBooksCache((prevBooks) => {
      if (prevBooks.find((b) => b.id === addedBook.id)) return prevBooks;
      return prevBooks.concat(addedBook);
    });
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>

        {!token ? (
          <button onClick={() => setPage("login")}>login</button>
        ) : (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommend")}>
              recommendations
            </button>
            <button onClick={logout}>logout</button>
          </>
        )}
      </div>

      <Authors show={page === "authors"} token={token} />
      <Books show={page === "books"} updateCacheWith={updateCacheWith} />
      <NewBook
        show={page === "add"}
        token={token}
        updateCacheWith={updateCacheWith}
      />
      <Login show={page === "login"} setToken={setToken} />
      <Recommended show={page === "recommend"} />
    </div>
  );
};

export default App;
