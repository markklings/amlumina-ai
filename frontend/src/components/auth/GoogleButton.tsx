import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import Button from "../ui/Button";
import FormError from "./FormError";

interface Props {
  onClick: () => void | Promise<void>;
  label?: string;
}

export default function GoogleButton({
  onClick,
  label = "Continue with Google",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setError(null);
    setLoading(true);
    try {
      await onClick();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start Google sign-in.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" loading={loading} onClick={handle}>
        {!loading && <FaGoogle className="size-4" />}
        {label}
      </Button>
      {error && <FormError message={error} />}
    </div>
  );
}
