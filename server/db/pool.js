import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

logger.info('Database pool initialized', { hasUrl: !!process.env.DATABASE_URL });

export default sql;

export async function initDB() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = await readFile(schemaPath, 'utf-8');
  const statements = schema.split(/;\s*$/m).filter(s => s.trim());
  logger.info(`Executing ${statements.length} schema statements`);
  for (const stmt of statements) {
    await sql(stmt);
  }
  logger.info('Database schema initialized successfully');
}

export async function seedDB() {
  const seedPath = join(__dirname, 'seed.sql');
  const seed = await readFile(seedPath, 'utf-8');
  const statements = seed.split(/;\s*$/m).filter(s => s.trim());
  logger.info(`Executing ${statements.length} seed statements`);
  for (const stmt of statements) {
    await sql(stmt);
  }
  logger.info('Database seeded successfully');
}
