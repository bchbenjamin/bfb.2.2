import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
const sql = neon(process.env.DATABASE_URL);

export default sql;

export async function initDB() {
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.sql');
  const schema = await readFile(schemaPath, 'utf-8');
  const statements = schema.split(/;\s*$/m).filter(s => s.trim());
  for (const stmt of statements) {
    await sql(stmt);
  }
  console.log('Database schema initialized successfully');
}

export async function seedDB() {
  const seedPath = join(dirname(fileURLToPath(import.meta.url)), 'seed.sql');
  const seed = await readFile(seedPath, 'utf-8');
  const statements = seed.split(/;\s*$/m).filter(s => s.trim());
  for (const stmt of statements) {
    console.log('EXECUTING STATEMENT:');
    console.log(stmt);
    console.log('--------------------');
    await sql(stmt);
  }
  console.log('Database seeded successfully');
}
