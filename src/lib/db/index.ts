import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { databaseUrl } from './url';

export const db = drizzle(neon(databaseUrl()), { schema });
