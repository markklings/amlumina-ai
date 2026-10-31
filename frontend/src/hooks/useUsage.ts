import { accountApi } from "../api/account.api";
import type { UsageData } from "../types/usage";
import { useResource } from "./useResource";

const EMPTY: UsageData = { limit: 0, days: [] };

export const useUsage = () =>
  useResource(
    (signal) => accountApi.usage(signal),
    EMPTY,
    (d) => d.days.every((x) => x.input + x.output === 0),
  );
