import type { Metadata } from "next";
import { BookCollection } from "@/components/book-collection";
export const metadata: Metadata = { title: "Book collection" };
export default function BooksPage() {
  return <BookCollection />;
}
