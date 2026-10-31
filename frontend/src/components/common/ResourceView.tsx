import type { ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";
import type { ResourceStatus } from "../../types/resource";
import Button from "../ui/Button";
import StateView from "./StateView";

interface Props {
  status: ResourceStatus;
  onRetry: () => void;
  skeleton: ReactNode;
  empty: ReactNode;
  disconnected?: ReactNode;
  children: ReactNode;
}

export default function ResourceView({
  status,
  onRetry,
  skeleton,
  empty,
  disconnected,
  children,
}: Props) {
  if (status === "loading") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading"
        className="animate-fade-in"
      >
        {skeleton}
      </div>
    );
  }
  if (status === "error") {
    return (
      <StateView
        icon={LuCircleAlert}
        title="Could not load this"
        description="Check your connection and try again."
        action={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }
  if (status === "disconnected") return <>{disconnected ?? empty}</>;
  if (status === "empty") return <>{empty}</>;
  return <div className="animate-fade-in">{children}</div>;
}
