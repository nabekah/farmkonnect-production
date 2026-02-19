import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import * as schema from './drizzle/schema';
import { desc } from 'drizzle-orm';

async function exportUsers() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }
    
    // Create connection
    const connection = await mysql.createConnection(dbUrl);
    const db = drizzle(connection, { schema, mode: 'default' });
    
    // Query users
    const allUsers = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      loginMethod: schema.users.loginMethod,
      approvalStatus: schema.users.approvalStatus,
      accountStatus: schema.users.accountStatus,
      createdAt: schema.users.createdAt,
    }).from(schema.users).orderBy(desc(schema.users.createdAt));
    
    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Login Method', 'Approval Status', 'Account Status', 'Created At'];
    const rows = allUsers.map(u => [
      u.id,
      u.name || 'N/A',
      u.email || 'N/A',
      u.phone || 'N/A',
      u.role || 'N/A',
      u.loginMethod || 'N/A',
      u.approvalStatus || 'N/A',
      u.accountStatus || 'N/A',
      u.createdAt || 'N/A'
    ]);
    
    // Convert to CSV with proper escaping
    const csv = [headers, ...rows].map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `/home/ubuntu/farmkonnect_users_${timestamp}.csv`;
    
    fs.writeFileSync(filename, csv, 'utf-8');
    console.log(`✅ CSV exported successfully!`);
    console.log(`📁 File: ${filename}`);
    console.log(`📊 Total records: ${allUsers.length}`);
    
    // Print summary statistics
    const approved = allUsers.filter(u => u.approvalStatus === 'approved').length;
    const pending = allUsers.filter(u => u.approvalStatus === 'pending').length;
    const rejected = allUsers.filter(u => u.approvalStatus === 'rejected').length;
    const active = allUsers.filter(u => u.accountStatus === 'active').length;
    
    console.log(`\n📈 Summary Statistics:`);
    console.log(`  • Total Users: ${allUsers.length}`);
    console.log(`  • Approved: ${approved}`);
    console.log(`  • Pending: ${pending}`);
    console.log(`  • Rejected: ${rejected}`);
    console.log(`  • Active Accounts: ${active}`);
    
    await connection.end();
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

exportUsers();
