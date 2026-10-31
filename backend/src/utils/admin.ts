import { env } from "../config/env.js";
import type { User } from "../db/schema.js";

const admins = (env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** A verified email is required, so nobody can claim an admin address by signing up first. */
export const isAdmin = (u: Pick<User, "email" | "emailVerifiedAt">) =>
  !!u.emailVerifiedAt && admins.includes(u.email.toLowerCase());
