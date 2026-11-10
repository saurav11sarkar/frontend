export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  publishedYear: number;
  isBorrowed: boolean;
  borrowerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookInput {
  title: string;
  author: string;
  category: string;
  publishedYear: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export interface BookQuery {
  searchTerm?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const CATEGORIES = [
  "Fiction",
  "Science",
  "History",
  "Programming",
  "Self-help",
  "Biography",
  "Poetry",
  "Other",
];
