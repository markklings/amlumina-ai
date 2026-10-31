import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import AuthCenterLayout from "../layouts/AuthCenterLayout";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AuthCenterLayout>
      <div className="flex animate-fade-up flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-zinc-500">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-zinc-500">
          The page you are looking for doesn't exist.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-3"
          onClick={() => navigate("/", { replace: true })}
        >
          Go home
        </Button>
      </div>
    </AuthCenterLayout>
  );
}
