import { LuMenu } from "react-icons/lu";
import { learningMethods } from "../../constants/methods";
import ThemeToggle from "../theme/ThemeToggle";
import IconButton from "../ui/IconButton";
import MethodMenu from "./MethodMenu";

interface Props {
  showMenu: boolean;
  methodId: number;
  onMenu: () => void;
  onMethodChange: (id: number) => void;
}

export default function ChatHeader({
  showMenu,
  methodId,
  onMenu,
  onMethodChange,
}: Props) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-1">
        {showMenu && (
          <IconButton label="Open sidebar" onClick={onMenu}>
            <LuMenu className="size-5" />
          </IconButton>
        )}
        <MethodMenu
          methods={learningMethods}
          selectedId={methodId}
          onSelect={onMethodChange}
        />
      </div>
      <ThemeToggle />
    </header>
  );
}
