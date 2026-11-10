import type { Metadata } from "next";
import { BookForm } from "@/components/book-form";
export const metadata: Metadata = { title: "Add a book" };
export default function NewBookPage() {
  return <BookForm />;
}
