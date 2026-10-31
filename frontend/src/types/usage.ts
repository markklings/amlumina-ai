export interface UsageDay {
  day: string; // YYYY-MM-DD (UTC), same as the backend ai_usage.day
  input: number;
  output: number;
}

export interface UsageData {
  limit: number; // DAILY_TOKEN_LIMIT
  days: UsageDay[]; // last 7 days, oldest first, today last
}
