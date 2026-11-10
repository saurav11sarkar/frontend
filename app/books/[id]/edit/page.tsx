import type { Metadata } from "next";
import { BookForm } from "@/components/book-form";

export const metadata: Metadata = { title: "Edit a book" };

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookForm key={id} bookId={id} />;
}
