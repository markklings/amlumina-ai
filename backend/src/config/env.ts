import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),

  TIDB_HOST: z.string(),
  TIDB_PORT: z.coerce.number().default(4000),
  TIDB_USER: z.string(),
  TIDB_PASSWORD: z.string(),
  TIDB_DATABASE: z.string(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_STATE_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  ENCRYPTION_KEY: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),

  GEMINI_MODEL: z.string().default('gemini-3.5-flash')
})

export const env = schema.parse(process.env)
