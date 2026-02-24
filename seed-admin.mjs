import { db } from './server/db.ts';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@farmkonnect.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@12345';

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin account...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, ADMIN_EMAIL),
    });
    
    if (existingAdmin) {
      console.log('✓ Admin account already exists');
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Username: ${ADMIN_USERNAME}`);
      return;
    }
    
    // Create admin account
    const result = await db.insert(users).values({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      passwordHash: hashedPassword,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✓ Admin account created successfully');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Username: ${ADMIN_USERNAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('✗ Error seeding admin account:', error);
    process.exit(1);
  }
}

seedAdmin().then(() => {
  console.log('\n✓ Seeding complete');
  process.exit(0);
});
