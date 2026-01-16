import * as fs from 'fs/promises';
import * as path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'storage');

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

// Initialize storage
ensureStorageDir();

/**
 * Read JSON file
 */
async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const filePath = path.join(STORAGE_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Write JSON file
 */
async function writeJSON(filename: string, data: any): Promise<void> {
  try {
    const filePath = path.join(STORAGE_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write ${filename}:`, error);
  }
}

// In-memory storage
export const storage = {
  config: {
    discordPluginWebhook: 'https://discord.com/api/webhooks/1461698320207577171/ZfZN0z3QrGgEAvCil7JYu_LnM_m3kOo-_x-gOj3uG6TR8ncZRYXTJCJQ2nVLBjwMR_P0',
    discordSkriptWebhook: 'https://discord.com/api/webhooks/1461698320207577171/ZfZN0z3QrGgEAvCil7JYu_LnM_m3kOo-_x-gOj3uG6TR8ncZRYXTJCJQ2nVLBjwMR_P0',
    discordConfigWebhook: 'https://discord.com/api/webhooks/1461698233360449638/Uw6it8sPDi47YzIbDEI_xCjgKSJ35f0NrTEPGuQrxsPkJp1dxqpYSoDbPcrZ6QHlnIkj',
    subscriptionPrice: 299,
    subscriptionDurationDays: 30,
    publicSharingEnabled: true,
    freeDailyGenerations: 3,
    freeDailyBuilds: 10
  },
  
  stats: {
    totalGenerations: 0,
    totalBuilds: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    dailyStats: [] as Array<{
      date: string;
      generations: number;
      builds: number;
    }>
  },
  
  subscriptions: [] as Array<{
    id: string;
    userId: string;
    discordId: string;
    discordUsername: string;
    startDate: number;
    expiryDate: number;
    status: 'active' | 'expired';
    price: number;
  }>,
  
  resources: [] as Array<{
    id: string;
    type: 'plugin' | 'skript' | 'config';
    name: string;
    code: string;
    filename: string;
    userId: string;
    userIp: string;
    isPublic: boolean;
    viewCount: number;
    shareableLink?: string;
    metadata?: any;
    createdAt: number;
  }>,
  
  users: [] as Array<{
    id: string;
    discordId?: string;
    discordUsername?: string;
    discordAvatar?: string;
    ipAddress: string;
    isVerified: boolean;
    createdAt: number;
    lastActive: number;
  }>
};

/**
 * Load storage from files
 */
export async function loadStorage() {
  console.log('[STORAGE] Loading data from files...');
  
  storage.config = await readJSON('config.json', storage.config);
  storage.stats = await readJSON('stats.json', storage.stats);
  storage.subscriptions = await readJSON('subscriptions.json', storage.subscriptions);
  storage.resources = await readJSON('resources.json', storage.resources);
  storage.users = await readJSON('users.json', storage.users);
  
  console.log('[STORAGE] Loaded:', {
    subscriptions: storage.subscriptions.length,
    resources: storage.resources.length,
    users: storage.users.length
  });
}

/**
 * Save storage to files
 */
export async function saveStorage() {
  await writeJSON('config.json', storage.config);
  await writeJSON('stats.json', storage.stats);
  await writeJSON('subscriptions.json', storage.subscriptions);
  await writeJSON('resources.json', storage.resources);
  await writeJSON('users.json', storage.users);
}

/**
 * Auto-save every 30 seconds
 */
setInterval(() => {
  saveStorage().catch(console.error);
}, 30000);

/**
 * Save on process exit
 */
process.on('SIGINT', async () => {
  console.log('[STORAGE] Saving data before exit...');
  await saveStorage();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[STORAGE] Saving data before exit...');
  await saveStorage();
  process.exit(0);
});
