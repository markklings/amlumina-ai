import { APP_NAME } from "../../constants/app";
import LumiMark from "../ui/LumiMark";

export default function AuthBrand() {
  return (
    <div className="flex items-center gap-2">
      <LumiMark />
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  );
}
