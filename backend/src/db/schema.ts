import { randomUUID } from "node:crypto";
import {
  mysqlTable,
  varchar,
  text,
  longtext,
  json,
  int,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    googleId: varchar("google_id", { length: 255 }),
    authProvider: mysqlEnum("auth_provider", ["local", "google"])
      .notNull()
      .default("local"),
    geminiApiKeyEncrypted: text("gemini_api_key_encrypted"),
    learningMethodId: int("learning_method_id"),
    emailVerifiedAt: timestamp("email_verified_at"),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_google_id_uq").on(t.googleId),
  ],
);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    userAgent: varchar("user_agent", { length: 512 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("refresh_token_hash_uq").on(t.tokenHash),
    index("refresh_user_idx").on(t.userId),
  ],
);

export const connectedApps = mysqlTable(
  "connected_apps",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleAccountId: varchar("google_account_id", { length: 255 }).notNull(),
    accountEmail: varchar("account_email", { length: 255 }).notNull(),
    accountType: mysqlEnum("account_type", ["personal", "edu"])
      .notNull()
      .default("personal"),
    apps: json("apps").$type<number[]>().notNull(),
    scopes: json("scopes").$type<string[]>().notNull(),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("connected_user_google_uq").on(t.userId, t.googleAccountId),
    index("connected_user_idx").on(t.userId),
  ],
);

export const chats = mysqlTable(
  "chats",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New chat"),
    learningMethodId: int("learning_method_id").notNull(),
    streamingStartedAt: timestamp("streaming_started_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("chats_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    chatId: varchar("chat_id", { length: 36 })
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: longtext("content").notNull(),
    status: mysqlEnum("status", ["complete", "streaming", "stopped", "error"])
      .notNull()
      .default("complete"),
    model: varchar("model", { length: 100 }),
    toolCalls: json("tool_calls").$type<{ name: string; ok: boolean }[]>(),
    createdAt: timestamp("created_at", { fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("messages_chat_created_idx").on(t.chatId, t.createdAt)],
);

export const aiUsage = mysqlTable(
  "ai_usage",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: varchar("day", { length: 10 }).notNull(),
    inputTokens: int("input_tokens").notNull().default(0),
    outputTokens: int("output_tokens").notNull().default(0),
  },
  (t) => [uniqueIndex("ai_usage_user_day_uq").on(t.userId, t.day)],
);

export const emailOtps = mysqlTable(
  "email_otps",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: int("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("email_otps_user_idx").on(t.userId)],
);

export const passwordResets = mysqlTable(
  "password_resets",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("password_resets_hash_uq").on(t.tokenHash),
    index("password_resets_user_idx").on(t.userId),
  ],
);

export const knownDevices = mysqlTable(
  "known_devices",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
    firstSeenAt: timestamp("first_seen_at")
      .notNull()
      .$defaultFn(() => new Date()),
    lastSeenAt: timestamp("last_seen_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("known_devices_user_fp_uq").on(t.userId, t.fingerprint)],
);

export const libraryItems = mysqlTable(
  "library_items",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["doc", "sheet", "folder"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    googleFileId: varchar("google_file_id", { length: 255 }).notNull(),
    accountEmail: varchar("account_email", { length: 255 }).notNull(),
    link: varchar("link", { length: 1024 }).notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("library_user_file_uq").on(t.userId, t.googleFileId),
    index("library_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const authCodes = mysqlTable(
  "auth_codes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("auth_codes_hash_uq").on(t.codeHash)],
);

export const usersRelations = relations(users, ({ many }) => ({
  connectedApps: many(connectedApps),
  refreshTokens: many(refreshTokens),
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const connectedAppsRelations = relations(connectedApps, ({ one }) => ({
  user: one(users, { fields: [connectedApps.userId], references: [users.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ConnectedApp = typeof connectedApps.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
