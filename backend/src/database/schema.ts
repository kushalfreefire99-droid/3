import db from './db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize database schema
 */
export function initializeSchema(): void {
  console.log('[DATABASE] Initializing schema...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      discord_id TEXT UNIQUE,
      ip_address TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL
    )
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      expiry_date INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'cancelled')),
      price REAL NOT NULL,
      payment_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('plugin', 'skript', 'config')),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      filename TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 1,
      view_count INTEGER NOT NULL DEFAULT 0,
      shareable_link TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Statistics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_generations INTEGER NOT NULL DEFAULT 0,
      total_builds INTEGER NOT NULL DEFAULT 0,
      new_users INTEGER NOT NULL DEFAULT 0,
      active_subscriptions INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Admin logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  console.log('[DATABASE] Creating indexes...');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
    CREATE INDEX IF NOT EXISTS idx_users_ip_address ON users(ip_address);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_date ON subscriptions(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
    CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
    CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);
    CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
    CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
    CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
  `);

  // Insert default configuration
  console.log('[DATABASE] Inserting default configuration...');
  
  const defaultConfig = {
    discord_plugin_webhook: '',
    discord_skript_webhook: '',
    discord_config_webhook: '',
    subscription_price: 299,
    subscription_duration_days: 30,
    public_sharing_enabled: true,
    free_daily_generations: 3,
    free_daily_builds: 10,
    premium_daily_generations: -1, // -1 means unlimited
    premium_daily_builds: -1
  };

  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO config (key, value, updated_at)
    VALUES (?, ?, ?)
  `);

  for (const [key, value] of Object.entries(defaultConfig)) {
    insertConfig.run(key, JSON.stringify(value), Date.now());
  }

  console.log('[DATABASE] Schema initialization complete');
}

/**
 * Create default admin user if none exists
 */
export function createDefaultAdmin(): void {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  
  if (adminExists.count === 0) {
    console.log('[DATABASE] Creating default admin user...');
    
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), username, passwordHash, Date.now());
    
    console.log('[DATABASE] Default admin created - Username:', username);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('[DATABASE] WARNING: Using default password "admin123". Please change it!');
    }
  }
}

/**
 * Initialize database (run migrations and setup)
 */
export function initializeDatabase(): void {
  try {
    initializeSchema();
    createDefaultAdmin();
    console.log('[DATABASE] Database ready');
  } catch (error) {
    console.error('[DATABASE] Failed to initialize database:', error);
    throw error;
  }
}
