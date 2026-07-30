/**
 * One-off script to create an admin account on any MySQL host
 * (works around the Mac mysql_native_password CLI issue)
 *
 * Usage: node database/create-admin.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function createAdmin() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Password is "password" — bcrypt hash generated ahead of time
    const passwordHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    await connection.execute(
      `INSERT INTO admins (name, email, password_hash, is_active)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['Admin', 'admin@craftcorner.in', passwordHash]
    );

    console.log('✅ Admin account created/updated successfully');
    console.log('   Email: admin@craftcorner.in');
    console.log('   Password: password');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await connection.end();
  }
}

createAdmin();
