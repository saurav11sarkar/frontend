const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync("lib/book-service.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

function client(fetch, url = "https://library.example/api/") {
  const exports = {};
  const context = {
    exports,
    fetch,
    process: { env: { NEXT_PUBLIC_API_URL: url } },
    URLSearchParams,
    AbortController,
    AbortSignal,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(source, context);
  return exports;
}
const response = (data, status = 200) =>
  new Response(JSON.stringify({ success: true, statusCode: status, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("list uses the configured API prefix and encoded backend query names", async () => {
  let called;
  const { bookService } = client(async (url, options) => {
    called = { url, options };
    return response([]);
  });
  await bookService.list({
    searchTerm: "Paulo & Coelho",
    category: "Science",
    page: 2,
    limit: 8,
    sortBy: "title",
    sortOrder: "asc",
  });
  const url = new URL(called.url);
  assert.equal(url.pathname, "/api/book");
  assert.equal(url.searchParams.get("searchTerm"), "Paulo & Coelho");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("limit"), "8");
  assert.equal(called.options.cache, "no-store");
});

test("all mutation methods use the existing backend contract", async () => {
  const calls = [];
  const { bookService } = client(async (url, options) => {
    calls.push({ url, ...options });
    return response({ id: "one" });
  });
  const book = {
    title: "Book",
    author: "Author",
    category: "Fiction",
    publishedYear: 2000,
  };
  await bookService.create(book);
  await bookService.update("one", book);
  await bookService.borrow("one", "Rahim");
  await bookService.returnBook("one");
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(JSON.parse(calls[0].body), book);
  assert.equal(calls[1].method, "PUT");
  assert.equal(calls[1].url, "https://library.example/api/book/one");
  assert.equal(calls[2].url, "https://library.example/api/book/one/borrow");
  assert.deepEqual(JSON.parse(calls[2].body), { borrowerName: "Rahim" });
  assert.equal(calls[3].url, "https://library.example/api/book/one/return");
  assert.equal(calls[3].body, undefined);
});

test("delete accepts 204 without attempting to parse JSON", async () => {
  const { bookService } = client(async (_url, options) => {
    assert.equal(options.method, "DELETE");
    return new Response(null, { status: 204 });
  });
  const result = await bookService.remove("one");
  assert.equal(result.statusCode, 204);
  assert.equal(result.data, null);
});

test("backend conflict and field messages are preserved", async () => {
  const { bookService } = client(
    async () =>
      new Response(
        JSON.stringify({
          error: "Book already exists",
          errorSources: [{ path: "title", message: "Choose another title" }],
        }),
        { status: 409 },
      ),
  );
  await assert.rejects(
    bookService.create({}),
    (error) =>
      error.status === 409 &&
      error.message === "Book already exists" &&
      error.fields.title === "Choose another title",
  );
});

test("non-JSON server errors produce a usable error message", async () => {
  const { bookService } = client(
    async () => new Response("Service unavailable", { status: 503 }),
  );
  await assert.rejects(
    bookService.list(),
    (error) => error.status === 503 && /try again/.test(error.message),
  );
});

test("network failures produce a connection message", async () => {
  const { bookService } = client(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    bookService.list(),
    (error) => error.status === 0 && /connection/.test(error.message),
  );
});

test("malformed success responses are rejected instead of breaking the page", async () => {
  const { bookService } = client(
    async () => new Response("{}", { status: 200 }),
  );
  await assert.rejects(bookService.list(), (error) =>
    /unexpected response/.test(error.message),
  );
});
