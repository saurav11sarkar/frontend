import { Icon } from "./icon";
const colors = ["sage", "sand", "clay", "blue", "plum"];
export function BookCover({
  title,
  large = false,
}: {
  title: string;
  large?: boolean;
}) {
  const color =
    colors[
      Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
        colors.length
    ];
  return (
    <div
      className={"book-cover " + color + (large ? " large" : "")}
      aria-hidden="true"
    >
      <span className="cover-line" />
      <Icon name="book" size={large ? 35 : 17} />
      <span className="cover-initials">
        {title
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")}
      </span>
    </div>
  );
}
