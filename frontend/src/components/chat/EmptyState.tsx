import { APP_NAME } from "../../constants/app";
import { suggestions } from "../../constants/suggestions";

interface Props {
  userName: string;
  onPick: (text: string) => void;
}

export default function EmptyState({ userName, onPick }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Hello, {userName}
        </h1>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-400 sm:text-4xl dark:text-zinc-600">
          What are we studying today?
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map(({ id, text, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(text)}
                className="flex h-32 w-full flex-col justify-between rounded-2xl border border-zinc-200 p-4 text-left text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span>{text}</span>
                <Icon className="size-5 self-end text-zinc-500" />
              </button>
            </li>
          ))}
        </ul>
        <p className="sr-only">{APP_NAME} study assistant</p>
      </div>
    </div>
  );
}
