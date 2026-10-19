import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { databaseUrl } from './src/lib/db/url';

config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl() },
});
