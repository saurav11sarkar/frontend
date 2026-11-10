# Folio - Library Book Manager Frontend

A responsive library workspace built with Next.js, React and TypeScript. Folio connects to the existing NestJS backend to manage a book collection and keep track of borrowers.

## Features

- Book collection with title, author, category, publication year and availability.
- Debounced title/author search and an exact category filter, including custom categories.
- Pagination and sorting by title, author, publication year or newest additions.
- Add and edit pages with a shared form, inline validation and live book preview.
- Borrower-name dialog, return confirmation and delete confirmation.
- Disabled edit/delete actions for borrowed books, matching the current backend rules.
- Loading skeletons, empty states, retry controls and success notifications.
- Responsive desktop table and mobile book cards.
- Keyboard-accessible controls, native modal focus containment and reduced-motion support.
- A single API service with timeout handling and readable backend error messages.

## Stack

Next.js App Router, React, TypeScript and plain CSS. The interface does not require a UI library, external fonts, image service or authentication provider.

## Prerequisites

- Node.js 22.12+ or Node.js 24 and npm.
- The NestJS backend running locally or deployed to an accessible URL.
- The backend database migrated and configured. See the backend README for its setup and seed commands.

## Run locally

Run these commands inside `frontend/`:

```bash
npm install
```

Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Configure your backend base URL:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Then start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000/books](http://localhost:3000/books). The home route `/` redirects to `/books`.

The frontend and backend must run on different ports. The example uses frontend port `3000` and backend port `8080`; use your actual backend port if it differs.

## Environment configuration

`NEXT_PUBLIC_API_URL` is the only frontend environment variable required. It includes the backend API prefix but does **not** include `/book`.

| Backend endpoint                        | Environment value                  |
| --------------------------------------- | ---------------------------------- |
| `http://localhost:8080/api/book`        | `http://localhost:8080/api`        |
| `http://localhost:3001/api/v1/book`     | `http://localhost:3001/api/v1`     |
| `https://your-backend.example/api/book` | `https://your-backend.example/api` |

All HTTP calls use this value automatically through `lib/book-service.ts`; changing domains does not require editing components. Without a value, the service defaults to `http://localhost:8080/api`.

Next.js loads environment variables automatically. A `.env.local` value takes priority over `.env`; if the URL seems unchanged, check both files. Restart `npm run dev` after changing the environment. Public variables are included at **build time**, so production URL changes require a new build/deployment.

Only put the public API URL here. Neon credentials and `DATABASE_URL` belong in the backend environment, never in a `NEXT_PUBLIC_` variable.

## Routes

| Route             | Screen                                 |
| ----------------- | -------------------------------------- |
| `/`               | Redirects to the collection            |
| `/books`          | Searchable, filterable book collection |
| `/books/new`      | Add a new book                         |
| `/books/:id/edit` | Edit an existing book                  |

Unavailable books, missing records and failed requests display a readable message. The edit page also blocks changes if the book is currently borrowed.

## Backend API contract

Requests go directly from the browser to the NestJS API. The service appends these paths to `NEXT_PUBLIC_API_URL`:

| Method | Path               | Purpose                                        |
| ------ | ------------------ | ---------------------------------------------- |
| GET    | `/book`            | List books                                     |
| POST   | `/book`            | Create a book                                  |
| GET    | `/book/:id`        | Get a book for editing                         |
| PUT    | `/book/:id`        | Update book details                            |
| DELETE | `/book/:id`        | Delete a book; handles an empty `204` response |
| POST   | `/book/:id/borrow` | Borrow a book                                  |
| POST   | `/book/:id/return` | Return a book                                  |

List requests use `searchTerm`, `category`, `page`, `limit`, `sortBy` and `sortOrder`. Eight books are displayed per page. Search is debounced by 250 ms; obsolete requests are aborted so older responses do not replace newer results.

The create/update body uses the backend's camelCase field names:

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "category": "Fiction",
  "publishedYear": 1988
}
```

Borrow body:

```json
{
  "borrowerName": "Rahim Ahmed"
}
```

The frontend expects the existing response envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Books retrieved successfully",
  "meta": { "page": 1, "limit": 8, "total": 0 },
  "data": []
}
```

Backend `error`, `message` and `errorSources` are used for failure messages. The service stops requests that take longer than 20 seconds.

## Validation and borrowing rules

- Title, author and category must not be blank after trimming.
- The year must be a whole number between 1900 and the current year.
- Category suggestions are provided, but custom category names are accepted.
- Borrowing requires a nonblank borrower name.
- Available books can be borrowed, edited or deleted.
- Borrowed books show the borrower's name and can be returned; edit and delete remain disabled.
- Duplicate-title errors from the backend are shown in the form.
- Save/confirm controls are disabled while a mutation is in progress.

The backend remains responsible for enforcing these rules. All changes are persisted through the API; there is no fake collection or browser-only book database.

## Production build

```bash
npm run build
npm start
```

For a different frontend port:

```bash
npm start -- --port 3002
```

The backend must remain running independently.

## Deployment

### A Next.js-compatible hosting platform

1. Push the project to your Git repository.
2. Import the repository and select **`frontend` as the project/root directory** when deploying from the full assignment repository.
3. Use the Next.js framework preset, `npm install` as the install command and `npm run build` as the build command.
4. Set `NEXT_PUBLIC_API_URL` to the deployed backend URL **including its API prefix**.
5. Deploy. The platform runs the Next.js application using its supported runtime.
6. If the backend restricts CORS, allow the exact deployed frontend origin in its configuration. Where the backend uses `FRONTEND_URL`, set that variable and restart the backend.
7. Open `/books` and check that the collection loads.

Use an HTTPS backend URL for an HTTPS frontend. A deployed frontend must use a reachable deployed backend, not `localhost`. On hosts offering automatic Git deployments, later pushes trigger new builds after the initial project connection is configured.

### Node.js hosting / VPS

Set `NEXT_PUBLIC_API_URL` in the build environment, run `npm install` and `npm run build`, then run `npm start` under your hosting platform's process manager. Configure its reverse proxy and domain to forward traffic to the frontend port. Do not use a static-files-only host: this project uses the Next.js runtime and a dynamic edit route.

No cloud hosting account or deployment has been created by this implementation.

## Verification

```bash
npm run build
npm test
```

The production build checks compilation and TypeScript. The lightweight Node test suite uses the installed TypeScript compiler and mocked fetch responses, without adding a test framework dependency. It checks API query encoding, environment URL handling, mutation requests, `204` deletes, backend field errors, network failures and malformed responses. It does not modify Neon data.

Manual review checklist:

- Search by title and author; combine search with a category.
- Verify a no-results search and clear the filters.
- Add a book, edit it and verify the collection updates.
- Try blank fields, a year below 1900 and a future year.
- Borrow a book, verify its borrower and disabled edit/delete controls, then return it.
- Cancel a delete confirmation, then delete an available test book.
- Check pagination with more than eight records.
- Stop the backend temporarily to check the error and retry states.
- Check at a phone width and use Tab/Escape to navigate dialogs.

## Project structure

```text
frontend/
  app/
    books/
      page.tsx
      new/page.tsx
      [id]/edit/page.tsx
    error.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx
  components/
    app-shell.tsx
    book-action-dialog.tsx
    book-collection.tsx
    book-cover.tsx
    book-form.tsx
    icon.tsx
    toast-provider.tsx
  lib/
    book-service.ts
    types.ts
  tests/
    book-service.test.cjs
  .env.example
  next.config.ts
```

Pages select the screen, components manage the interface, and `book-service.ts` contains every HTTP call. `types.ts` defines the shared API types. The global stylesheet contains the responsive layouts and visual styles.

## Improvements with more time

- Add automated browser tests against an isolated backend database.
- Persist search and pagination in the URL for shareable filtered views.
- Add a categories endpoint if the collection grows substantially.
- Add borrowing history if required by the product.

## AI assistance

AI tools assisted with the frontend components, API integration, responsive styling, automated API-service tests and this README. The code uses simple React state, native fetch and reusable components to keep it understandable for review and the in-person assessment.
