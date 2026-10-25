import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function LegalLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
    >
      {children}
    </Link>
  );
}
