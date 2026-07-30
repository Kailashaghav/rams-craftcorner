/**
 * Production Database Migration Script
 * Connects DIRECTLY to your hosted database (e.g. Clever Cloud) using
 * DB_NAME from .env — does NOT try to create a new database, since
 * free-tier hosts only grant permission on the one database they
 * already provisioned for you.
 *
 * Usage: node database/migrate-production.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // ← connects directly to your provisioned DB
    multipleStatements: true,
  });

  try {
    console.log(`🔄 Running production migration on database "${process.env.DB_NAME}"...`);
    const sql = fs.readFileSync(path.join(__dirname, 'schema-production.sql'), 'utf8');
    await connection.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
