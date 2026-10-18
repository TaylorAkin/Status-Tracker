// Verifies DATABASE_URL in .env.local without printing it.
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is empty in .env.local');

const sql = neon(url);
const [r] = await sql`select version(), current_database() as db`;
console.log('connected:', r.db, '|', String(r.version).split(' ').slice(0, 2).join(' '));
const tables = await sql`select table_name from information_schema.tables where table_schema = 'public'`;
console.log('public tables:', tables.map((t) => t.table_name));
