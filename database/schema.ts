import { pgTable, varchar, bigint } from "drizzle-orm/pg-core";
/**
 * Used to handle authentication.
 *
 * Represents the relationship between a user and a reference to that user
 * (eg. email, username)
 *
 * @see: https://lucia-auth.com/basics/keys
 */
export const userKey = pgTable("user_key", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  password: varchar("hashed_password"),
});

/** Used to handle authentication.
 *
 * Allows the authentication helpers to keep track of requests made by users.
 * These are created on login, validated on each request, and deleted on signout
 * (or other account sensitive operations)
 *
 * https://lucia-auth.com/basics/sessions
 */
export const userSession = pgTable("user_session", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  activeExpires: bigint("active_expires", {
    mode: "number",
  }).notNull(),
  idleExpires: bigint("idle_expires", {
    mode: "number",
  }).notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull(),
});
