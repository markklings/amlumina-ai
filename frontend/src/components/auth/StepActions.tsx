import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import Button from "../ui/Button";

interface Props {
  nextLabel: string;
  loading?: boolean;
  onBack?: () => void;
}

export default function StepActions({ nextLabel, loading, onBack }: Props) {
  return (
    <>
      {onBack && (
        <Button size="lg" onClick={onBack} disabled={loading}>
          <LuArrowLeft className="size-4" />
          Back
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="flex-1"
      >
        {nextLabel}
        {!loading && <LuArrowRight className="size-4" />}
      </Button>
    </>
  );
}
