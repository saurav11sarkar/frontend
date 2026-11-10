"use client";
import { useEffect, useRef, useState } from "react";
import { bookService } from "@/lib/book-service";
import type { Book } from "@/lib/types";
import { Icon } from "./icon";

export type BookAction = "borrow" | "return" | "delete";
export function BookActionDialog({
  book,
  action,
  onClose,
  onSuccess,
}: {
  book: Book;
  action: BookAction;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  useEffect(() => {
    dialog.current?.showModal();
    if (action === "borrow")
      dialog.current?.querySelector<HTMLInputElement>("#borrower")?.focus();
  }, [action]);
  const title =
    action === "borrow"
      ? "A new chapter begins."
      : action === "return"
        ? "Welcome back to the shelf."
        : "Remove this book?";
  const label =
    action === "borrow"
      ? "Confirm borrow"
      : action === "return"
        ? "Mark as returned"
        : "Delete book";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    if (action === "borrow" && !name.trim()) {
      setNameError("Please enter the borrower's name.");
      dialog.current?.querySelector<HTMLInputElement>("#borrower")?.focus();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (action === "borrow") await bookService.borrow(book.id, name.trim());
      if (action === "return") await bookService.returnBook(book.id);
      if (action === "delete") await bookService.remove(book.id);
      onSuccess(
        action === "borrow"
          ? "Book borrowed successfully."
          : action === "return"
            ? "Book returned to the collection."
            : "Book deleted successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="action-dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <form onSubmit={submit} noValidate>
        <div className="dialog-top">
          <span
            className={
              "dialog-symbol " + (action === "delete" ? "danger-symbol" : "")
            }
          >
            <Icon
              name={
                action === "delete"
                  ? "trash"
                  : action === "return"
                    ? "return"
                    : "book"
              }
              size={25}
            />
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description" className="muted">
          {action === "borrow" ? (
            <>
              Who will be taking <strong>{book.title}</strong> home?
            </>
          ) : action === "return" ? (
            <>
              Mark <strong>{book.title}</strong>
              {book.borrowerName ? (
                <>
                  {" "}
                  from <strong>{book.borrowerName}</strong>
                </>
              ) : null}{" "}
              as available again.
            </>
          ) : (
            <>
              Permanently delete <strong>{book.title}</strong> by {book.author}?
              This cannot be undone.
            </>
          )}
        </p>
        {action === "borrow" && (
          <div className="field">
            <label htmlFor="borrower">
              Borrower’s name <span>*</span>
            </label>
            <input
              id="borrower"
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder="e.g. Rahim Ahmed"
              disabled={busy}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "borrower-error" : undefined}
            />
            {nameError && (
              <p className="field-error" id="borrower-error">
                {nameError}
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={"button " + (action === "delete" ? "danger" : "primary")}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner" /> Please wait
              </>
            ) : (
              label
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
