import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { fail } from '../utils/response'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function parseBearer(req: Request): string | null {
  const h = req.headers.authorization
  return h?.startsWith('Bearer ') ? h.slice(7) : null
}

export function verifyAccess(token: string): string | null {
  try {
    return (jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string }).sub
  } catch {
    return null
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = parseBearer(req)
  const userId = token ? verifyAccess(token) : null
  if (!userId) return fail(res, 401, 'UNAUTHORIZED', 'Invalid or missing access token.')
  req.userId = userId
  next()
}
