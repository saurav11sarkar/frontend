"use client";
import { bookService } from "@/lib/book-service";
import { CATEGORIES, type Book } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookActionDialog, type BookAction } from "./book-action-dialog";
import { BookCover } from "./book-cover";
import { Icon } from "./icon";
import { useToast } from "./toast-provider";

const PAGE_SIZE = 8;
export function BookCollection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selection, setSelection] = useState<{
    book: Book;
    action: BookAction;
  } | null>(null);
  const notify = useToast();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await bookService.list(
          {
            searchTerm: search.trim(),
            category: category.trim(),
            page,
            limit: PAGE_SIZE,
            sortBy:
              sort === "newest"
                ? "createdAt"
                : sort === "year"
                  ? "publishedYear"
                  : sort === "author"
                    ? "author"
                    : "title",
            sortOrder: sort === "newest" || sort === "year" ? "desc" : "asc",
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const count = result.meta?.total ?? result.data.length;
        if (page > 1 && (page - 1) * PAGE_SIZE >= count) {
          setPage(Math.max(1, Math.ceil(count / PAGE_SIZE)));
          return;
        }
        setBooks(result.data);
        setTotal(count);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Unable to load books.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, sort, page, revision]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
    setLoading(true);
  }
  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
    setLoading(true);
  }
  function resetFilters() {
    setSearch("");
    setCategory("");
    setPage(1);
    setLoading(true);
  }
  const categories = Array.from(
    new Set([...CATEGORIES, ...books.map((book) => book.category)]),
  ).sort();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!search.trim() || !!category.trim();

  return (
    <>
      <section className="collection-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span /> YOUR EVERYDAY LIBRARY COMPANION
          </span>
          <h1>
            Good books.
            <br />
            <em>Great company.</em>
          </h1>
          <p>
            Keep your collection in order and every story
            <br className="desktop-break" /> in good hands. Your library, all in
            one place.
          </p>
          <Link href="/books/new" className="button hero-button">
            <Icon name="plus" size={18} /> Add a new book
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✦</span>
          <div className="art-book book-one">
            <span>
              THE ART
              <br />
              OF READING
            </span>
            <i />
          </div>
          <div className="art-book book-two">
            <span>
              one more
              <br />
              <em>chapter.</em>
            </span>
            <Icon name="book" size={32} />
          </div>
          <div className="art-book book-three">
            <span>
              A WORLD
              <br />
              WITHIN
              <br />
              PAGES
            </span>
            <div className="art-sun" />
          </div>
          <div className="art-shelf" />
          <span className="art-caption">
            A LITTLE SHELF. ENDLESS POSSIBILITIES.
          </span>
        </div>
      </section>

      <section
        className="collection-section"
        aria-labelledby="collection-heading"
      >
        <div className="section-heading">
          <div className="heading-with-count">
            <h2 id="collection-heading">Book collection</h2>
            <span className="count-pill">
              {loading ? "…" : error ? "—" : total}{" "}
              {filtered
                ? total === 1
                  ? "result"
                  : "results"
                : total === 1
                  ? "book"
                  : "books"}
            </span>
          </div>
          <span className="section-note">Find your next chapter.</span>
        </div>
        <div className="collection-panel">
          <div className="toolbar">
            <div className="search-field">
              <Icon name="search" size={19} />
              <input
                aria-label="Search books by title or author"
                type="search"
                placeholder="Search by title or author…"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
              />
            </div>
            <div className="category-field">
              <Icon name="filter" size={18} />
              <input
                aria-label="Filter by category"
                list="filter-categories"
                placeholder="All categories"
                value={category}
                onChange={(event) => changeCategory(event.target.value)}
              />
              <datalist id="filter-categories">
                {categories.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {category && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Clear category filter"
                  onClick={() => changeCategory("")}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
            <label className="sort-field">
              <span className="sr-only">Sort books</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                  setLoading(true);
                }}
              >
                <option value="newest">Newest first</option>
                <option value="title">Title: A–Z</option>
                <option value="author">Author: A–Z</option>
                <option value="year">Year: newest</option>
              </select>
            </label>
            <button
              type="button"
              className="icon-button refresh-button"
              aria-label="Refresh collection"
              title="Refresh collection"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setRevision((value) => value + 1);
              }}
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>
          {filtered && (
            <div className="filter-summary">
              <span>
                Showing{" "}
                {search.trim() ? (
                  <>
                    matches for <strong>“{search.trim()}”</strong>
                  </>
                ) : (
                  "books"
                )}
                {category.trim() ? (
                  <>
                    {" "}
                    in <strong>{category.trim()}</strong>
                  </>
                ) : null}
              </span>
              <button className="text-button" onClick={resetFilters}>
                Clear filters <Icon name="close" size={13} />
              </button>
            </div>
          )}

          {error ? (
            <div className="empty-state" role="alert">
              <span className="empty-icon">
                <Icon name="alert" size={30} />
              </span>
              <h3>We couldn’t load your collection.</h3>
              <p className="muted">{error}</p>
              <button
                className="button secondary"
                onClick={() => {
                  setLoading(true);
                  setRevision((value) => value + 1);
                }}
              >
                <Icon name="refresh" size={16} /> Try again
              </button>
            </div>
          ) : loading ? (
            <div
              className="loading-table"
              role="status"
              aria-label="Loading books"
            >
              <div className="table-label-row">
                <span>BOOK & AUTHOR</span>
                <span>CATEGORY</span>
                <span>YEAR</span>
                <span>STATUS</span>
                <span>ACTIONS</span>
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div className="skeleton-row" key={row}>
                  <span className="skeleton skeleton-cover" />
                  <div>
                    <span className="skeleton skeleton-title" />
                    <span className="skeleton skeleton-author" />
                  </div>
                  <span className="skeleton skeleton-badge" />
                  <span className="skeleton skeleton-badge" />
                </div>
              ))}
              <span className="sr-only">Loading your collection…</span>
            </div>
          ) : !books.length ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name={filtered ? "search" : "book"} size={32} />
              </span>
              <h3>
                {filtered
                  ? "No books on this shelf."
                  : "Every library starts with one book."}
              </h3>
              <p className="muted">
                {filtered
                  ? "Try another title, author or category to find what you’re looking for."
                  : "Add your first book and give your collection a home."}
              </p>
              {filtered ? (
                <button className="button secondary" onClick={resetFilters}>
                  Clear filters
                </button>
              ) : (
                <Link href="/books/new" className="button primary">
                  <Icon name="plus" size={17} /> Add your first book
                </Link>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="book-table">
                <thead>
                  <tr>
                    <th scope="col">Book & author</th>
                    <th scope="col">Category</th>
                    <th scope="col">Year</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="actions-heading">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td data-label="Book">
                        <div className="book-identity">
                          <BookCover title={book.title} />
                          <div>
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Category">
                        <span className="category-pill">{book.category}</span>
                      </td>
                      <td data-label="Year" className="year-cell">
                        {book.publishedYear}
                      </td>
                      <td data-label="Status">
                        <div className="status-cell">
                          <span
                            className={
                              "status-badge " +
                              (book.isBorrowed ? "borrowed" : "available")
                            }
                          >
                            <span />
                            {book.isBorrowed ? "Borrowed" : "Available"}
                          </span>
                          {book.isBorrowed && (
                            <span
                              className="borrower-name"
                              title={book.borrowerName ?? ""}
                            >
                              {book.borrowerName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="row-actions">
                          <button
                            type="button"
                            className={
                              "button small " +
                              (book.isBorrowed
                                ? "return-button"
                                : "borrow-button")
                            }
                            onClick={() =>
                              setSelection({
                                book,
                                action: book.isBorrowed ? "return" : "borrow",
                              })
                            }
                            aria-label={
                              (book.isBorrowed ? "Return " : "Borrow ") +
                              book.title
                            }
                          >
                            <Icon
                              name={book.isBorrowed ? "return" : "arrow"}
                              size={15}
                            />
                            {book.isBorrowed ? "Return" : "Borrow"}
                          </button>
                          {book.isBorrowed ? (
                            <button
                              className="icon-button"
                              disabled
                              aria-label={"Edit " + book.title}
                              title="Return this book before editing"
                            >
                              <Icon name="edit" size={17} />
                            </button>
                          ) : (
                            <Link
                              className="icon-button"
                              href={"/books/" + book.id + "/edit"}
                              aria-label={"Edit " + book.title}
                              title="Edit book"
                            >
                              <Icon name="edit" size={17} />
                            </Link>
                          )}
                          <button
                            type="button"
                            className="icon-button delete-button"
                            disabled={book.isBorrowed}
                            title={
                              book.isBorrowed
                                ? "Return this book before deleting"
                                : "Delete book"
                            }
                            aria-label={"Delete " + book.title}
                            onClick={() =>
                              setSelection({ book, action: "delete" })
                            }
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <div className="pagination">
              <p>
                Showing{" "}
                <strong>
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)}
                </strong>{" "}
                of <strong>{total}</strong> books
              </p>
              <div className="page-controls">
                <button
                  className="page-button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((value) => value - 1);
                    setLoading(true);
                  }}
                >
                  <Icon name="back" size={16} />
                </button>
                <span>
                  Page <strong>{page}</strong> of {pages}
                </span>
                <button
                  className="page-button"
                  aria-label="Next page"
                  disabled={page >= pages}
                  onClick={() => {
                    setPage((value) => value + 1);
                    setLoading(true);
                  }}
                >
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="collection-footnote">
          <Icon name="book" size={16} />
          <span>
            Borrowed books stay in your collection. Return them before editing
            or deleting.
          </span>
        </div>
      </section>
      {selection && (
        <BookActionDialog
          key={selection.book.id + selection.action}
          book={selection.book}
          action={selection.action}
          onClose={() => setSelection(null)}
          onSuccess={(message) => {
            setSelection(null);
            notify(message);
            setLoading(true);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </>
  );
}
