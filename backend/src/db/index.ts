import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { env } from '../config/env'
import * as schema from './schema'

const pool = mysql.createPool({
  host: env.TIDB_HOST,
  port: env.TIDB_PORT,
  user: env.TIDB_USER,
  password: env.TIDB_PASSWORD,
  database: env.TIDB_DATABASE,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  connectionLimit: 10
})

export const db = drizzle(pool, { schema, mode: 'default' })
