import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { users } from './db/db';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seedAdminUser() {
  const username = 'DigQuestor';
  const email = 'digquestor@digquest.com';
  const password = 'digquestor'; // Change this after first login

  // Check if user exists
  const existing = await db.select().from(users).where(users.username.eq(username));
  if (existing.length > 0) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    username,
    email,
    password: hashedPassword,
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log('Admin user seeded successfully.');
  process.exit(0);
}

seedAdminUser().catch((err) => {
  console.error('Error seeding admin user:', err);
  process.exit(1);
});
