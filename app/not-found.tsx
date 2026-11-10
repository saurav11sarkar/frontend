import Link from "next/link";
import { Icon } from "@/components/icon";
export default function NotFound() {
  return (
    <section className="empty-state standalone">
      <span className="empty-icon">
        <Icon name="book" size={32} />
      </span>
      <h1>This page isn’t on our shelf.</h1>
      <p className="muted">
        The page may have moved, or the link may be incorrect.
      </p>
      <Link className="button primary" href="/books">
        Back to collection
      </Link>
    </section>
  );
}
