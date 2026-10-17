import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { users, connectedApps, type User } from "../db/schema";
import { APP_IDS, appsFromGrantedScopes } from "../constants/apps";
import { encrypt } from "../utils/crypto";
import { ok, fail } from "../utils/response";
import { issueTokens } from "../services/token.service";
import { requireAuth, parseBearer, verifyAccess } from "../middleware/auth";
import {
  buildGoogleAuthUrl,
  newOAuthClient,
  verifyState,
  type GoogleMode,
} from "../services/google.service";
import { env } from "../config/env";

const router = Router();

const publicUser = (u: User) => ({
  id: u.id,
  full_name: u.fullName,
  email: u.email,
  auth_provider: u.authProvider,
  has_gemini_key: !!u.geminiApiKeyEncrypted,
  learning_method_id: u.learningMethodId,
  created_at: u.createdAt,
});

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
    gemini_key: z.string().trim().min(20, "Invalid Gemini API Key"),
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
    message: "Password do not match",
  });

router.post("/signup", async (req, res, next) => {
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

    const id = crypto.randomUUID();
    await db.insert(users).values({
      id: id,
      fullName: d.full_name,
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 12),
      geminiApiKeyEncrypted: encrypt(d.gemini_key),
      authProvider: "local",
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const tokens = await issueTokens(id, req);

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

router.post("/login", async (req, res, next) => {
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

router.get("/google/callback", async (req, res, next) => {
  try {
    const {
      code,
      state: rawState,
      error,
    } = req.query as Record<string, string | undefined>;
    if (error)
      return fail(res, 400, "GOOGLE_DENIED", `Google returned: ${error}`);
    if (!code || !rawState)
      return fail(res, 400, "BAD_REQUEST", "Missing code or state");

    const state = verifyState(rawState);
    if (!state)
      return fail(res, 400, "INVALID_STATE", "State expired or invalid");

    const client = newOAuthClient();
    const { tokens: g } = await client.getToken(code);
    if (!g.id_token)
      return fail(res, 400, "NO_ID_TOKEN", "Google did not return an id_token");

    const ticket = await client.verifyIdToken({
      idToken: g.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email)
      return fail(res, 400, "BAD_PROFILE", "Could not read Google profile");
    if (!p.email_verified)
      return fail(res, 400, "EMAIL_UNVERIFIED", "Google email is not verified");

    const email = p.email.toLowerCase();

    let user: User | undefined;

    if (state.mode === "connect") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, state.userId!))
        .limit(1);
      if (!user)
        return fail(res, 404, "USER_NOT_FOUND", "User no longer exists");
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
        const id = crypto.randomUUID();
        await db.insert(users).values({
          id: id,
          fullName: p.name ?? email.split("@")[0],
          email: email,
          googleId: p.sub,
          authProvider: "google",
        });
        [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      } else if (!user.googleId) {
        await db
          .update(users)
          .set({ googleId: p.sub })
          .where(eq(users.id, user.id));
      }
    }

    const grantedScopes = (g.scope ?? "").split(" ").filter(Boolean);
    const grantedApps = appsFromGrantedScopes(g.scope ?? "");
    let connected = null;

    if (state.mode === "connect" || state.apps.length > 0) {
      const accountType =
        email.includes(".edu") || p.hd?.includes(".edu") ? "edu" : "personal";
      const values = {
        userId: user.id,
        googleAccountId: p.sub,
        accountEmail: email,
        accountType: accountType,
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

      connected = {
        account_email: email,
        account_type: accountType,
        apps: grantedApps,
      };
    }

    const tokens = await issueTokens(user.id, req);
    return ok(res, {
      user: publicUser(user),
      tokens,
      connected_account: connected,
    });
  } catch (e) {
    next(e);
  }
});

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

export default router;
