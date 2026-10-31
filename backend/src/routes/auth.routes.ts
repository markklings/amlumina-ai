import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  users,
  connectedApps,
  refreshTokens,
  passwordResets,
  authCodes,
  type User,
} from "../db/schema.js";
import { APP_IDS, appsFromGrantedScopes } from "../constants/apps.js";
import { decrypt, encrypt, sha256 } from "../utils/crypto.js";
import { ok, fail } from "../utils/response.js";
import { issueTokens } from "../services/token.service.js";
import { requireAuth, parseBearer, verifyAccess } from "../middleware/auth.js";
import {
  buildGoogleAuthUrl,
  newOAuthClient,
  verifyState,
  type GoogleMode,
} from "../services/google.service.js";
import { env } from "../config/env.js";
import { publicUser } from "../serializers/user.js";
import { mail } from "../services/mail.service.js";
import { checkDevice } from "../services/device.service.js";
import {
  OTP_TTL_MIN,
  issueOtp,
  secondsUntilResend,
  verifyOtp,
} from "../services/otp.service.js";
import { limiter } from "../middleware/rateLimit.js";
import { waitUntil } from "@vercel/functions";

const router = Router();

const signupLimiter = limiter(10);
const loginLimiter = limiter(10);
const forgotLimiter = limiter(5);
const resetLimiter = limiter(10);
const otpLimiter = limiter(20);
const exchangeLimiter = limiter(20);

const RESET_TTL_MIN = 30;
const RESET_COOLDOWN_MS = 60_000;

const parseApps = (raw: unknown): number[] => {
  if (typeof raw !== "string" || !raw) return [];
  return [...new Set(raw.split(",").map(Number))].filter((n) =>
    APP_IDS.includes(n),
  );
};
const signupSchema = z
  .object({
    full_name: z.string().trim().min(2).max(255),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    confirm_password: z.string(),
    gemini_key: z.string().trim().min(20, "Invalid Gemini API key"),
    accepted_terms: z.literal(true, {
      message: "You must accept the Terms of Use and Privacy & Data",
    }),
    apps: z
      .array(
        z
          .number()
          .int()
          .refine((n) => APP_IDS.includes(n), "Unknown app id"),
      )
      .optional()
      .default([]),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

router.post("/signup", signupLimiter, async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const d = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, d.email))
      .limit(1);
    if (existing)
      return fail(
        res,
        409,
        "EMAIL_TAKEN",
        "An account with this email already exists",
      );

    const id = randomUUID();
    await db.insert(users).values({
      id,
      fullName: d.full_name,
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 12),
      geminiApiKeyEncrypted: encrypt(d.gemini_key),
      authProvider: "local",
      termsAcceptedAt: new Date(),
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const tokens = await issueTokens(id, req);

    await checkDevice(id, req).catch((e) =>
      console.error("Device register failed:", e),
    );
    try {
      mail.otp(user, await issueOtp(id), OTP_TTL_MIN);
    } catch (e) {
      console.error("OTP issue failed (user can resend):", e);
    }

    const connect_url = d.apps.length
      ? buildGoogleAuthUrl({ mode: "connect", apps: d.apps, userId: id })
      : null;
    return ok(res, { user: publicUser(user), tokens, connect_url }, 201);
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const valid = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;
    if (!user || !valid)
      return fail(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Incorrect email or password",
      );

    const tokens = await issueTokens(user.id, req);
    if (await checkDevice(user.id, req).catch(() => false))
      mail.newLogin(user, req);

    return ok(res, { user: publicUser(user), tokens });
  } catch (e) {
    next(e);
  }
});

router.get("/google", (req, res) => {
  const mode: GoogleMode = req.query.mode === "connect" ? "connect" : "login";
  const apps = parseApps(req.query.apps);

  let userId: string | undefined;
  if (mode === "connect") {
    const token = parseBearer(req);
    userId = (token && verifyAccess(token)) || undefined;
    if (!userId)
      return fail(
        res,
        401,
        "UNAUTHORIZED",
        "Login required to connect an account",
      );
  }

  return ok(res, { url: buildGoogleAuthUrl({ mode, apps, userId }) });
});

const frontendBase = () => env.FRONTEND_URL.replace(/\/+$/, "");
const backToFrontend = (
  res: import("express").Response,
  params: Record<string, string>,
) =>
  res.redirect(
    `${frontendBase()}/auth/callback?${new URLSearchParams(params).toString()}`,
  );

router.get("/google/callback", async (req, res) => {
  try {
    const {
      code,
      state: rawState,
      error,
    } = req.query as Record<string, string | undefined>;
    if (error)
      return backToFrontend(res, {
        error: error === "access_denied" ? "access_denied" : "google_error",
      });
    if (!code || !rawState)
      return backToFrontend(res, { error: "bad_request" });

    const state = verifyState(rawState);
    if (!state) return backToFrontend(res, { error: "invalid_state" });

    const client = newOAuthClient();
    const { tokens: g } = await client.getToken(code);
    if (!g.id_token) return backToFrontend(res, { error: "google_error" });

    const ticket = await client.verifyIdToken({
      idToken: g.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email)
      return backToFrontend(res, { error: "google_error" });
    if (!p.email_verified)
      return backToFrontend(res, { error: "email_unverified" });

    const email = p.email.toLowerCase();
    let user: User | undefined;

    if (state.mode === "connect") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, state.userId!))
        .limit(1);
      if (!user) return backToFrontend(res, { error: "user_not_found" });
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, p.sub))
        .limit(1);
      if (!user)
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

      if (!user) {
        const id = randomUUID();
        await db.insert(users).values({
          id,
          fullName: p.name ?? email.split("@")[0],
          email,
          googleId: p.sub,
          authProvider: "google",
          emailVerifiedAt: new Date(),
        });
        [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      } else {
        const patch: Partial<typeof users.$inferInsert> = {};
        if (!user.googleId) patch.googleId = p.sub;
        if (!user.emailVerifiedAt && user.email === email)
          patch.emailVerifiedAt = new Date();
        if (Object.keys(patch).length) {
          await db.update(users).set(patch).where(eq(users.id, user.id));
          [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);
        }
      }
    }

    const grantedScopes = (g.scope ?? "").split(" ").filter(Boolean);
    const grantedApps = appsFromGrantedScopes(g.scope ?? "");

    if (state.mode === "connect" || state.apps.length > 0) {
      if (grantedApps.length === 0) {
        return backToFrontend(res, { error: "no_apps_granted" });
      }
      const accountType =
        email.endsWith(".edu") || p.hd?.endsWith(".edu") ? "edu" : "personal";
      const values = {
        userId: user.id,
        googleAccountId: p.sub,
        accountEmail: email,
        accountType,
        apps: grantedApps,
        scopes: grantedScopes,
        accessTokenEncrypted: g.access_token ? encrypt(g.access_token) : null,
        refreshTokenEncrypted: g.refresh_token
          ? encrypt(g.refresh_token)
          : null,
        tokenExpiresAt: g.expiry_date ? new Date(g.expiry_date) : null,
      } as const;

      await db
        .insert(connectedApps)
        .values(values)
        .onDuplicateKeyUpdate({
          set: {
            accountType: values.accountType,
            apps: values.apps,
            scopes: values.scopes,
            accessTokenEncrypted: values.accessTokenEncrypted,
            tokenExpiresAt: values.tokenExpiresAt,
            ...(values.refreshTokenEncrypted && {
              refreshTokenEncrypted: values.refreshTokenEncrypted,
            }),
          },
        });
    }

    if (state.mode === "connect") {
      mail.accountUpdated(user, `The Google account ${email} was connected`);
      return backToFrontend(res, {
        mode: "connect",
        email,
        apps: grantedApps.join(","),
      });
    }

    const oneTime = randomBytes(32).toString("hex");
    await db.insert(authCodes).values({
      userId: user.id,
      codeHash: sha256(oneTime),
      expiresAt: new Date(Date.now() + 2 * 60_000),
    });
    return res.redirect(`${frontendBase()}/auth/callback#code=${oneTime}`);
  } catch (e) {
    console.error(
      "Google callback failed:",
      e instanceof Error ? e.message : e,
    );
    return backToFrontend(res, { error: "server_error" });
  }
});

const exchangeSchema = z.object({ code: z.string().length(64) });
const BAD_CODE = "This sign-in link is invalid or has expired. Try again.";

router.post("/google/exchange", exchangeLimiter, async (req, res, next) => {
  try {
    const parsed = exchangeSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "INVALID_CODE", BAD_CODE);

    const [row] = await db
      .select()
      .from(authCodes)
      .where(eq(authCodes.codeHash, sha256(parsed.data.code)))
      .limit(1);
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now())
      return fail(res, 400, "INVALID_CODE", BAD_CODE);

    const [claim] = await db
      .update(authCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(authCodes.id, row.id), isNull(authCodes.usedAt)));
    if (claim.affectedRows === 0)
      return fail(res, 400, "INVALID_CODE", BAD_CODE);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (!user) return fail(res, 400, "INVALID_CODE", BAD_CODE);

    const tokens = await issueTokens(user.id, req);
    if (await checkDevice(user.id, req).catch(() => false))
      mail.newLogin(user, req);

    return ok(res, { user: publicUser(user), tokens });
  } catch (e) {
    next(e);
  }
});

// Removed: October 23, 2026 - New Google Callback Route Was Built
// router.get("/google/callback", async (req, res, next) => {
//   try {
//     const {
//       code,
//       state: rawState,
//       error,
//     } = req.query as Record<string, string | undefined>;
//     if (error)
//       return fail(res, 400, "GOOGLE_DENIED", `Google returned: ${error}`);
//     if (!code || !rawState)
//       return fail(res, 400, "BAD_REQUEST", "Missing code or state");
//
//     const state = verifyState(rawState);
//     if (!state)
//       return fail(res, 400, "INVALID_STATE", "State expired or invalid");
//
//     const client = newOAuthClient();
//     const { tokens: g } = await client.getToken(code);
//     if (!g.id_token)
//       return fail(res, 400, "NO_ID_TOKEN", "Google did not return an id_token");
//
//     const ticket = await client.verifyIdToken({
//       idToken: g.id_token,
//       audience: env.GOOGLE_CLIENT_ID,
//     });
//     const p = ticket.getPayload();
//     if (!p?.sub || !p.email)
//       return fail(res, 400, "BAD_PROFILE", "Could not read Google profile");
//     if (!p.email_verified)
//       return fail(res, 400, "EMAIL_UNVERIFIED", "Google email is not verified");
//
//     const email = p.email.toLowerCase();
//     let user: User | undefined;
//
//     if (state.mode === "connect") {
//       [user] = await db
//         .select()
//         .from(users)
//         .where(eq(users.id, state.userId!))
//         .limit(1);
//       if (!user)
//         return fail(res, 404, "USER_NOT_FOUND", "User no longer exists");
//     } else {
//       [user] = await db
//         .select()
//         .from(users)
//         .where(eq(users.googleId, p.sub))
//         .limit(1);
//       if (!user)
//         [user] = await db
//           .select()
//           .from(users)
//           .where(eq(users.email, email))
//           .limit(1);
//
//       if (!user) {
//         const id = randomUUID();
//         await db.insert(users).values({
//           id,
//           fullName: p.name ?? email.split("@")[0],
//           email,
//           googleId: p.sub,
//           authProvider: "google",
//           emailVerifiedAt: new Date(),
//         });
//         [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
//       } else {
//         const patch: Partial<typeof users.$inferInsert> = {};
//         if (!user.googleId) patch.googleId = p.sub;
//         if (!user.emailVerifiedAt && user.email === email)
//           patch.emailVerifiedAt = new Date();
//         if (Object.keys(patch).length) {
//           await db.update(users).set(patch).where(eq(users.id, user.id));
//           [user] = await db
//             .select()
//             .from(users)
//             .where(eq(users.id, user.id))
//             .limit(1);
//         }
//       }
//     }
//
//     const grantedScopes = (g.scope ?? "").split(" ").filter(Boolean);
//     const grantedApps = appsFromGrantedScopes(g.scope ?? "");
//     let connected = null;
//
//     if (state.mode === "connect" || state.apps.length > 0) {
//       const accountType =
//         email.endsWith(".edu") || p.hd?.endsWith(".edu") ? "edu" : "personal";
//       const values = {
//         userId: user.id,
//         googleAccountId: p.sub,
//         accountEmail: email,
//         accountType,
//         apps: grantedApps,
//         scopes: grantedScopes,
//         accessTokenEncrypted: g.access_token ? encrypt(g.access_token) : null,
//         refreshTokenEncrypted: g.refresh_token
//           ? encrypt(g.refresh_token)
//           : null,
//         tokenExpiresAt: g.expiry_date ? new Date(g.expiry_date) : null,
//       } as const;
//
//       await db
//         .insert(connectedApps)
//         .values(values)
//         .onDuplicateKeyUpdate({
//           set: {
//             accountType: values.accountType,
//             apps: values.apps,
//             scopes: values.scopes,
//             accessTokenEncrypted: values.accessTokenEncrypted,
//             tokenExpiresAt: values.tokenExpiresAt,
//             ...(values.refreshTokenEncrypted && {
//               refreshTokenEncrypted: values.refreshTokenEncrypted,
//             }),
//           },
//         });
//
//       connected = {
//         account_email: email,
//         account_type: accountType,
//         apps: grantedApps,
//       };
//     }
//
//     const tokens = await issueTokens(user.id, req);
//
//     if (state.mode === "connect") {
//       mail.accountUpdated(user, `The Google account ${email} was connected`);
//     } else if (await checkDevice(user.id, req).catch(() => false)) {
//       mail.newLogin(user, req);
//     }
//
//     return ok(res, {
//       user: publicUser(user),
//       tokens,
//       connected_account: connected,
//     });
//   } catch (e) {
//     next(e);
//   }
// });

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");

    const accounts = await db
      .select({
        id: connectedApps.id,
        account_email: connectedApps.accountEmail,
        account_type: connectedApps.accountType,
        apps: connectedApps.apps,
        created_at: connectedApps.createdAt,
      })
      .from(connectedApps)
      .where(eq(connectedApps.userId, user.id));

    return ok(res, { user: publicUser(user), connected_accounts: accounts });
  } catch (e) {
    next(e);
  }
});

const refreshSchema = z.object({ refresh_token: z.string().min(20).max(256) });

router.post("/refresh", async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }

    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, sha256(parsed.data.refresh_token)))
      .limit(1);
    if (!row)
      return fail(res, 401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");

    if (row.revokedAt) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.userId, row.userId),
            isNull(refreshTokens.revokedAt),
          ),
        );
      return fail(
        res,
        401,
        "REFRESH_TOKEN_REUSED",
        "Session ended for security. Please log in again.",
      );
    }
    if (row.expiresAt.getTime() < Date.now()) {
      return fail(
        res,
        401,
        "REFRESH_TOKEN_EXPIRED",
        "Session expired. Please log in again.",
      );
    }

    const [r] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.id, row.id), isNull(refreshTokens.revokedAt)),
      );
    if (r.affectedRows === 0)
      return fail(res, 401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (!user)
      return fail(res, 401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");

    const tokens = await issueTokens(user.id, req);
    return ok(res, { user: publicUser(user), tokens });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, sha256(parsed.data.refresh_token)));
    return ok(res, { logged_out: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/accounts/:id", requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const [acct] = await db
      .select()
      .from(connectedApps)
      .where(
        and(eq(connectedApps.id, id), eq(connectedApps.userId, req.userId!)),
      )
      .limit(1);
    if (!acct)
      return fail(res, 404, "ACCOUNT_NOT_FOUND", "Connected account not found");

    try {
      const token = acct.refreshTokenEncrypted
        ? decrypt(acct.refreshTokenEncrypted)
        : acct.accessTokenEncrypted
          ? decrypt(acct.accessTokenEncrypted)
          : null;
      if (token) await newOAuthClient().revokeToken(token);
    } catch (e) {
      console.warn(
        "Google token revoke failed (continuing):",
        e instanceof Error ? e.message : e,
      );
    }

    await db
      .delete(connectedApps)
      .where(
        and(eq(connectedApps.id, id), eq(connectedApps.userId, req.userId!)),
      );

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (user)
      mail.accountUpdated(
        user,
        `The Google account ${acct.accountEmail} was disconnected`,
      );

    return ok(res, {
      disconnected: true,
      id,
      account_email: acct.accountEmail,
    });
  } catch (e) {
    next(e);
  }
});

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

async function processResetRequest(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user?.passwordHash) return;

  const [recent] = await db
    .select({ createdAt: passwordResets.createdAt })
    .from(passwordResets)
    .where(eq(passwordResets.userId, user.id))
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);
  if (recent && Date.now() - recent.createdAt.getTime() < RESET_COOLDOWN_MS)
    return;

  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(
      and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)),
    );

  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000),
  });

  const url = `${env.FRONTEND_URL.replace(/\/+$/, "")}/reset-password?token=${token}`;
  mail.passwordReset(user, url, RESET_TTL_MIN);
}

router.post("/forgot-password", forgotLimiter, async (req, res, next) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    ok(res, { sent: true });
    // void processResetRequest(parsed.data.email).catch((e) =>
    //   console.error("Password reset request failed:", e),
    // );
    const work = processResetRequest(parsed.data.email).catch((e) =>
      console.error("Password reset request failed:", e),
    );
    try {
      waitUntil(work);
    } catch {
      /* local dev */
    }
  } catch (e) {
    next(e);
  }
});

const resetSchema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(8).max(128),
});

router.post("/reset-password", resetLimiter, async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const { token, password } = parsed.data;

    const [row] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, sha256(token)))
      .limit(1);
    if (!row || row.usedAt)
      return fail(
        res,
        400,
        "INVALID_RESET_TOKEN",
        "This reset link is invalid.",
      );
    if (row.expiresAt.getTime() < Date.now())
      return fail(
        res,
        400,
        "RESET_TOKEN_EXPIRED",
        "This reset link has expired.",
      );

    const hash = await bcrypt.hash(password, 12);
    const done = await db.transaction(async (tx) => {
      const [claim] = await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(
          and(eq(passwordResets.id, row.id), isNull(passwordResets.usedAt)),
        );
      if (claim.affectedRows === 0) return false;

      await tx
        .update(users)
        .set({ passwordHash: hash })
        .where(eq(users.id, row.userId));
      await tx
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, row.userId));
      return true;
    });
    if (!done)
      return fail(
        res,
        400,
        "INVALID_RESET_TOKEN",
        "This reset link is invalid.",
      );

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (user) mail.passwordChanged(user);

    return ok(res, { reset: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/verify-email/send",
  requireAuth,
  otpLimiter,
  async (req, res, next) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.userId!))
        .limit(1);
      if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");
      if (user.emailVerifiedAt) return ok(res, { email_verified: true });

      const wait = await secondsUntilResend(user.id);
      if (wait > 0) {
        return fail(
          res,
          429,
          "OTP_RESEND_WAIT",
          `Wait ${wait}s before requesting another code.`,
          { retry_after_seconds: wait },
        );
      }

      const code = await issueOtp(user.id);
      try {
        await mail.otpNow(user, code, OTP_TTL_MIN);
      } catch (e) {
        console.error("OTP email failed:", e instanceof Error ? e.message : e);
        return fail(
          res,
          502,
          "EMAIL_FAILED",
          "We could not send the email. Try again shortly.",
        );
      }
      return ok(res, { sent: true, expires_in_seconds: OTP_TTL_MIN * 60 });
    } catch (e) {
      next(e);
    }
  },
);

const verifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

router.post(
  "/verify-email",
  requireAuth,
  otpLimiter,
  async (req, res, next) => {
    try {
      const parsed = verifySchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(
          res,
          422,
          "VALIDATION_ERROR",
          "Invalid input",
          parsed.error.flatten().fieldErrors,
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.userId!))
        .limit(1);
      if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");
      if (user.emailVerifiedAt)
        return ok(res, { email_verified: true, user: publicUser(user) });

      const result = await verifyOtp(user.id, parsed.data.code);
      if (result === "invalid")
        return fail(res, 400, "OTP_INVALID", "That code is incorrect.");
      if (result === "expired")
        return fail(
          res,
          400,
          "OTP_EXPIRED",
          "This code has expired. Request a new one.",
        );
      if (result === "locked")
        return fail(
          res,
          429,
          "OTP_TOO_MANY_ATTEMPTS",
          "Too many incorrect attempts. Request a new code.",
        );

      await db
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(users.id, user.id));
      const [fresh] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      return ok(res, { email_verified: true, user: publicUser(fresh) });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
