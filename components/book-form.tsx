"use client";
import { ApiError, bookService } from "@/lib/book-service";
import { CATEGORIES } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookCover } from "./book-cover";
import { Icon } from "./icon";
import { useToast } from "./toast-provider";

type Values = {
  title: string;
  author: string;
  category: string;
  publishedYear: string;
};
type Errors = Partial<Record<keyof Values, string>>;
const empty: Values = {
  title: "",
  author: "",
  category: "",
  publishedYear: "",
};

export function BookForm({ bookId }: { bookId?: string }) {
  const router = useRouter();
  const notify = useToast();
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!!bookId);
  const [borrowed, setBorrowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const busyRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!bookId) return;
    const controller = new AbortController();
    bookService
      .get(bookId, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setValues({
          title: data.title,
          author: data.author,
          category: data.category,
          publishedYear: String(data.publishedYear),
        });
        setBorrowed(data.isBorrowed);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load this book.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [bookId, retry]);

  function update(field: keyof Values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setError("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || borrowed) return;
    const next: Errors = {};
    if (!values.title.trim()) next.title = "Please enter a book title.";
    if (!values.author.trim()) next.author = "Please enter the author’s name.";
    if (!values.category.trim())
      next.category = "Please enter or choose a category.";
    const year = Number(values.publishedYear);
    if (
      !values.publishedYear.trim() ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > currentYear
    )
      next.publishedYear =
        "Enter a whole year between 1900 and " + currentYear + ".";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="' + first + '"]')
        ?.focus();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    const data = {
      title: values.title.trim(),
      author: values.author.trim(),
      category: values.category.trim(),
      publishedYear: year,
    };
    try {
      if (bookId) await bookService.update(bookId, data);
      else await bookService.create(data);
      notify(
        bookId
          ? "Book updated successfully."
          : "A new book has joined your collection.",
      );
      router.push("/books");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save this book. Please try again.",
      );
      if (error instanceof ApiError) {
        const fieldErrors: Errors = {};
        for (const field of Object.keys(empty) as (keyof Values)[])
          if (error.fields[field]) fieldErrors[field] = error.fields[field];
        if (error.status === 409 && /title|already exists/i.test(error.message))
          fieldErrors.title =
            "A book with this title already exists. Please use a different title.";
        setErrors(fieldErrors);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const fields: {
    name: keyof Values;
    label: string;
    placeholder: string;
    hint?: string;
  }[] = [
    { name: "title", label: "Book title", placeholder: "e.g. The Alchemist" },
    { name: "author", label: "Author", placeholder: "e.g. Paulo Coelho" },
    {
      name: "category",
      label: "Category",
      placeholder: "Choose or type a category",
      hint: "Choose a suggestion or enter your own category.",
    },
    {
      name: "publishedYear",
      label: "Published year",
      placeholder: "e.g. 1988",
      hint: "Between 1900 and " + currentYear + ".",
    },
  ];
  return (
    <section className="form-page">
      <Link href="/books" className="back-link">
        <Icon name="back" size={17} /> Back to collection
      </Link>
      <div className="form-page-heading">
        <span className="eyebrow dark">
          {bookId ? "A LITTLE UPDATE" : "MAKE ROOM ON THE SHELF"}
        </span>
        <h1>{bookId ? "Edit book details." : "A new story belongs here."}</h1>
        <p className="muted">
          {bookId
            ? "Keep your collection accurate, one detail at a time."
            : "Add a book to your collection. The next great read starts here."}
        </p>
      </div>
      {loading ? (
        <div className="form-loading" role="status">
          <span className="spinner" />
          <span>Opening your book…</span>
        </div>
      ) : loadError ? (
        <div className="empty-state collection-panel" role="alert">
          <Icon name="alert" size={30} />
          <h2>We couldn’t open this book.</h2>
          <p className="muted">{loadError}</p>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => {
                setLoadError("");
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </button>
            <Link href="/books" className="button primary">
              Back to collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="form-layout">
          <form
            ref={formRef}
            className="book-form"
            onSubmit={submit}
            noValidate
          >
            <div className="form-section-heading">
              <span className="form-section-icon">
                <Icon name="book" size={21} />
              </span>
              <div>
                <h2>Book information</h2>
                <p>
                  Fields marked <span className="required">*</span> are
                  required.
                </p>
              </div>
            </div>
            {borrowed && (
              <div className="error-banner" role="alert">
                <Icon name="alert" size={19} />
                <span>
                  This book is currently borrowed. Return it from the collection
                  before editing.
                </span>
              </div>
            )}
            {error && (
              <div className="error-banner" role="alert">
                <Icon name="alert" size={19} />
                <span>{error}</span>
              </div>
            )}
            <fieldset disabled={busy || borrowed} className="form-fields">
              {fields.map((field) => (
                <div key={field.name} className="field">
                  <label htmlFor={field.name}>
                    {field.label} <span>*</span>
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.name === "publishedYear" ? "number" : "text"}
                    min={field.name === "publishedYear" ? 1900 : undefined}
                    max={
                      field.name === "publishedYear" ? currentYear : undefined
                    }
                    step={field.name === "publishedYear" ? 1 : undefined}
                    list={
                      field.name === "category" ? "book-categories" : undefined
                    }
                    value={values[field.name]}
                    placeholder={field.placeholder}
                    onChange={(event) => update(field.name, event.target.value)}
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={
                      errors[field.name]
                        ? field.name + "-error"
                        : field.hint
                          ? field.name + "-hint"
                          : undefined
                    }
                    autoComplete="off"
                  />
                  {errors[field.name] ? (
                    <p id={field.name + "-error"} className="field-error">
                      {errors[field.name]}
                    </p>
                  ) : field.hint ? (
                    <p className="field-hint" id={field.name + "-hint"}>
                      {field.hint}
                    </p>
                  ) : null}
                </div>
              ))}
              <datalist id="book-categories">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </fieldset>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => router.push("/books")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={busy || borrowed}
              >
                {busy ? (
                  <>
                    <span className="spinner" /> Saving book…
                  </>
                ) : (
                  <>
                    <Icon name={bookId ? "check" : "plus"} size={18} />
                    {bookId ? "Save changes" : "Add book"}
                  </>
                )}
              </button>
            </div>
          </form>
          <aside className="form-aside">
            <div className="preview-card">
              <span className="eyebrow dark">ON YOUR SHELF</span>
              <BookCover title={values.title || "Your next chapter"} large />
              <h2>{values.title.trim() || "Your next great read"}</h2>
              <p>{values.author.trim() || "An author worth discovering"}</p>
              <div className="preview-details">
                <span>{values.category.trim() || "Category"}</span>
                <span>{values.publishedYear || "Year"}</span>
              </div>
              <span
                className={
                  "status-badge " + (borrowed ? "borrowed" : "available")
                }
              >
                <span />
                {borrowed ? "Borrowed" : "Available"}
              </span>
            </div>
            <div className="aside-note">
              <Icon name="book" size={20} />
              <p>
                {bookId
                  ? "Small details make a well-kept library. Your changes will appear in the collection right away."
                  : "New books are automatically marked as available and ready for their first reader."}
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
