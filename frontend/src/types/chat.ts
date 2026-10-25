export type Role = "user" | "assistant";
export type MessageStatus = "complete" | "streaming" | "stopped" | "error";
export type ToolStatus = "running" | "done" | "error";

export interface ToolCall {
  id: string;
  name: string;
  status: ToolStatus;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  status: MessageStatus;
  toolCalls: ToolCall[];
  createdAt: string;
  errorMessage?: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatGroup {
  label: string;
  items: ChatSummary[];
}
