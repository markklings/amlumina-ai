import type { ChatGroup, ChatSummary } from "../types/chat";

const DAY = 86_400_000;

export function groupChatsByDate(chats: ChatSummary[]): ChatGroup[] {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups: ChatGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const chat of chats) {
    const t = new Date(chat.updatedAt).getTime();
    const age = startOfToday - t;
    const i = t >= startOfToday ? 0 : age <= DAY ? 1 : age <= 7 * DAY ? 2 : 3;
    groups[i].items.push(chat);
  }
  return groups.filter((g) => g.items.length > 0);
}
