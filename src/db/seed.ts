import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding admin user...');
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));

    if (existingAdmin.length === 0) {
      const hashedPassword = await Bun.password.hash('admin123');
      await db.insert(users).values({
        name: 'Administrator',
        username: 'admin',
        password: hashedPassword,
        email: 'admin@serangnursecare.com',
        role: 'superadmin',
      });
      console.log('✅ Admin user created successfully with role "superadmin": username "admin", password "admin123"');
    } else {
      await db.update(users).set({ role: 'superadmin' }).where(eq(users.username, 'admin'));
      console.log('ℹ️ Admin user already exists. Role updated to "superadmin".');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
  process.exit(0);
}

seed();
