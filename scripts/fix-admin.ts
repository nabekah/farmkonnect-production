import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'admin@farmkonnect.com';

async function fixAdmin() {
  try {
    console.log('🔧 Fixing admin account...');
    
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    // Update admin account with required fields
    const result = await db
      .update(users)
      .set({
        emailVerified: true,
        approvalStatus: 'approved',
        accountStatus: 'active',
        failedLoginAttempts: 0,
        name: 'System Administrator',
      })
      .where(eq(users.email, ADMIN_EMAIL));
    
    console.log('✓ Admin account fixed successfully');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Email Verified: true`);
    console.log(`  Approval Status: approved`);
    console.log(`  Account Status: active`);
    
  } catch (error) {
    console.error('✗ Error fixing admin account:', error);
    process.exit(1);
  }
}

fixAdmin().then(() => {
  console.log('\n✓ Fix complete');
  process.exit(0);
});
