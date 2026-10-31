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
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export interface StudyProfile {
  level?: string;
  subjects?: string[];
  goals?: string;
  language?: string;
}
export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

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
    studyProfile: json("study_profile").$type<StudyProfile>(),
    emailDigest: boolean("email_digest").notNull().default(false),
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
    pinned: boolean("pinned").notNull().default(false),
    summary: text("summary"),
    summaryUpTo: timestamp("summary_up_to", { fsp: 3 }),
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

export const documents = mysqlTable(
  "documents",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: longtext("content").notNull(), // Markdown
    source: mysqlEnum("source", ["user", "lumi"]).notNull().default("user"),
    format: mysqlEnum("format", ["md", "html"]).notNull().default("md"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("documents_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const calendarEvents = mysqlTable(
  "calendar_events",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startAt: varchar("start_at", { length: 32 }).notNull(),
    endAt: varchar("end_at", { length: 32 }).notNull(),
    allDay: boolean("all_day").notNull().default(false),
    color: varchar("color", { length: 16 }).notNull().default("zinc"),
    source: mysqlEnum("source", ["user", "lumi"]).notNull().default("user"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("events_user_start_idx").on(t.userId, t.startAt)],
);

export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    notes: text("notes"),
    dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    remindDays: int("remind_days"), // null = no reminder, 0 = on the due day, 1 = a day before...
    remindedAt: timestamp("reminded_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("tasks_user_idx").on(t.userId, t.completed)],
);

const pk = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID());
const owner = () =>
  varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const created = () =>
  timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date());

/* FLASHCARDS */
export const flashDecks = mysqlTable(
  "flash_decks",
  {
    id: pk(),
    userId: owner(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: created(),
  },
  (t) => [index("flash_decks_user_idx").on(t.userId)],
);

export const flashCards = mysqlTable(
  "flash_cards",
  {
    id: pk(),
    userId: owner(),
    deckId: varchar("deck_id", { length: 36 })
      .notNull()
      .references(() => flashDecks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    ease: int("ease").notNull().default(250), // x100, so 250 = 2.5
    intervalDays: int("interval_days").notNull().default(0),
    reps: int("reps").notNull().default(0),
    lapses: int("lapses").notNull().default(0),
    dueAt: timestamp("due_at")
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: created(),
  },
  (t) => [
    index("flash_cards_deck_idx").on(t.deckId),
    index("flash_cards_user_due_idx").on(t.userId, t.dueAt),
  ],
);

/* QUIZZES */
export const quizzes = mysqlTable(
  "quizzes",
  {
    id: pk(),
    userId: owner(),
    title: varchar("title", { length: 255 }).notNull(),
    questions: json("questions").$type<QuizQuestion[]>().notNull(),
    createdAt: created(),
  },
  (t) => [index("quizzes_user_idx").on(t.userId)],
);

export const quizAttempts = mysqlTable(
  "quiz_attempts",
  {
    id: pk(),
    userId: owner(),
    quizId: varchar("quiz_id", { length: 36 })
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: int("score").notNull(),
    total: int("total").notNull(),
    answers: json("answers").$type<(number | null)[]>().notNull(),
    createdAt: created(),
  },
  (t) => [index("quiz_attempts_quiz_idx").on(t.quizId)],
);

/* FOCUS SESSIONS */
export const studySessions = mysqlTable(
  "study_sessions",
  {
    id: pk(),
    userId: owner(),
    minutes: int("minutes").notNull(),
    label: varchar("label", { length: 100 }),
    day: varchar("day", { length: 10 }).notNull(), // the student's local date, YYYY-MM-DD
    createdAt: created(),
  },
  (t) => [index("study_sessions_user_day_idx").on(t.userId, t.day)],
);

export const shares = mysqlTable(
  "shares",
  {
    id: pk(),
    userId: owner(),
    kind: mysqlEnum("kind", ["doc", "deck"]).notNull(),
    targetId: varchar("target_id", { length: 36 }).notNull(),
    token: varchar("token", { length: 48 }).notNull(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("shares_token_uq").on(t.token),
    uniqueIndex("shares_target_uq").on(t.userId, t.kind, t.targetId),
  ],
);

export const chatFiles = mysqlTable(
  "chat_files",
  {
    id: pk(),
    userId: owner(),
    chatId: varchar("chat_id", { length: 36 }), // null until the message that uses it is sent
    name: varchar("name", { length: 255 }).notNull(),
    text: longtext("text").notNull(),
    chars: int("chars").notNull(),
    createdAt: created(),
  },
  (t) => [
    index("chat_files_chat_idx").on(t.chatId),
    index("chat_files_user_idx").on(t.userId),
  ],
);

export const reviewLog = mysqlTable(
  "review_log",
  {
    id: pk(),
    userId: owner(),
    grade: int("grade").notNull(), // 0 to 3
    day: varchar("day", { length: 10 }).notNull(),
    createdAt: created(),
  },
  (t) => [index("review_log_user_day_idx").on(t.userId, t.day)],
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
