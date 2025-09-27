// Script to run migration on Railway database
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('Running migration on Railway database...');

try {
  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push the schema to the database
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL }
  });

  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}