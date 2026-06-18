import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    workspaceId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("workspace_id_idx").on(t.workspaceId),
    index("name_idx").on(t.name),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const sentMail = pgTable("sent_mail", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  messageId: text("message_id"),
  threadId: text("thread_id"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const draftMail = pgTable("draft_mail", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  to: text("to"),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject"),
  body: text("body"),
  threadId: text("thread_id"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// User writing style — updated nightly by summarization worker
export const userWritingProfiles = pgTable("user_writing_profiles", {
  userId:               varchar("user_id", { length: 255 }).primaryKey().references(() => user.id, { onDelete: "cascade" }),
  tone:                 varchar("tone", { length: 50 }).default("professional"),
  avgEmailLength:       integer("avg_email_length").default(150),
  commonGreetings:      jsonb("common_greetings").$type<string[]>().default([]),
  commonClosings:       jsonb("common_closings").$type<string[]>().default([]),
  writingStyleSummary:  text("writing_style_summary"),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Every AI draft correction a user made
export const aiCorrections = pgTable("ai_corrections", {
  id:              uuid("id").defaultRandom().primaryKey(),
  userId:          varchar("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  aiDraftText:     text("ai_draft_text").notNull(),
  userEditedText:  text("user_edited_text").notNull(),
  correctionType:  varchar("correction_type", { length: 50 }), // tone | length | phrasing | fact
  recipientEmail:  varchar("recipient_email", { length: 255 }),
  emailSubject:    varchar("email_subject", { length: 500 }),
  threadId:        varchar("thread_id", { length: 255 }),
  collapsedAt:     timestamp("collapsed_at", { withTimezone: true }), // null = not yet summarized
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("ai_corrections_user_idx").on(t.userId, t.createdAt),
]);

// Per-recipient preferences learned over time
export const recipientPatterns = pgTable("recipient_patterns", {
  id:             uuid("id").defaultRandom().primaryKey(),
  userId:         varchar("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  preferredTone:  varchar("preferred_tone", { length: 50 }),
  maxWordCount:   integer("max_word_count"),
  customNotes:    text("custom_notes"),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("recipient_patterns_user_idx").on(t.userId, t.recipientEmail),
]);

// Contacts tracked for search suggestions and statistics
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  interactionCount: integer("interaction_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  index("contacts_user_id_idx").on(t.userId),
  index("contacts_email_idx").on(t.email),
  uniqueIndex("contacts_user_email_unique_idx").on(t.userId, t.email),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).notNull(), // 'free', 'pro', etc.
  status: varchar("status", { length: 50 }).notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  index("subscriptions_user_idx").on(t.userId),
]);

export * from "./corsair-schema";
