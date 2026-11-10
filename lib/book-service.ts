import type { ApiResponse, Book, BookInput, BookQuery } from "./types";

// Include the backend prefix in the environment value, e.g. https://api.example.com/api.
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/[/]+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(API_URL + "/book" + path, {
      ...options,
      cache: "no-store",
      signal: options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    if (response.status === 204)
      return {
        statusCode: 204,
        success: true,
        message: "Book deleted successfully",
        data: null as T,
      };
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      const fields: Record<string, string> = {};
      if (Array.isArray(payload?.errorSources)) {
        for (const source of payload.errorSources) {
          if (
            typeof source.path === "string" &&
            typeof source.message === "string"
          )
            fields[source.path] = source.message;
        }
      }
      const message = payload?.error || payload?.message;
      throw new ApiError(
        Array.isArray(message)
          ? message.join(". ")
          : typeof message === "string"
            ? message
            : "The request could not be completed. Please try again.",
        response.status,
        fields,
      );
    }
    if (!payload || !("data" in payload))
      throw new ApiError(
        "The server returned an unexpected response.",
        response.status,
      );
    return payload as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    if (controller.signal.aborted)
      throw new ApiError(
        "The server took too long to respond. Please try again.",
        408,
      );
    throw new ApiError(
      "Unable to reach the library. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const bookService = {
  list(query: BookQuery = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return request<Book[]>("?" + params.toString(), { signal });
  },
  get(id: string, signal?: AbortSignal) {
    return request<Book>("/" + encodeURIComponent(id), { signal });
  },
  create(data: BookInput) {
    return request<Book>("", { method: "POST", body: JSON.stringify(data) });
  },
  update(id: string, data: BookInput) {
    return request<Book>("/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  borrow(id: string, borrowerName: string) {
    return request<Book>("/" + encodeURIComponent(id) + "/borrow", {
      method: "POST",
      body: JSON.stringify({ borrowerName }),
    });
  },
  returnBook(id: string) {
    return request<Book>("/" + encodeURIComponent(id) + "/return", {
      method: "POST",
    });
  },
  remove(id: string) {
    return request<null>("/" + encodeURIComponent(id), { method: "DELETE" });
  },
};
