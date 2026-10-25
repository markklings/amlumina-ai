import type { User } from "../db/schema.js";

export const publicUser = (u: User) => ({
  id: u.id,
  full_name: u.fullName,
  email: u.email,
  auth_provider: u.authProvider,
  has_gemini_key: !!u.geminiApiKeyEncrypted,
  learning_method_id: u.learningMethodId,
  email_verified: !!u.emailVerifiedAt,
  created_at: u.createdAt,
});
