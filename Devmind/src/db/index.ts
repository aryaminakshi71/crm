import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb(env: { DB?: D1Database }) {
  if (!env.DB) {
    console.warn('D1 Database not configured');
    return null;
  }
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof getDb>;
export { schema };
