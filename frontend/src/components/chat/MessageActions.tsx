import { useState } from "react";
import { LuCheck, LuCopy, LuRefreshCw } from "react-icons/lu";
import IconButton from "../ui/IconButton";

interface Props {
  text: string;
  onRetry?: () => void;
}

export default function MessageActions({ text, onRetry }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="mt-2 flex gap-1">
      {text && (
        <IconButton
          label={copied ? "Copied" : "Copy reply"}
          onClick={() => void copy()}
          className="size-8"
        >
          {copied ? (
            <LuCheck className="size-4" />
          ) : (
            <LuCopy className="size-4" />
          )}
        </IconButton>
      )}
      {onRetry && (
        <IconButton label="Try again" onClick={onRetry} className="size-8">
          <LuRefreshCw className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
