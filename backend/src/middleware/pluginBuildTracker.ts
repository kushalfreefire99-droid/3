import { Request, Response, NextFunction } from 'express';

interface PluginBuildRecord {
  ip: string;
  count: number;
  date: string;
  isAuthenticated: boolean;
}

// In-memory storage (in production, use Redis or database)
const pluginBuildStore = new Map<string, PluginBuildRecord>();

const DAILY_LIMIT_PLUGIN_BUILDS = 10;

/**
 * Tracks plugin builds per IP address with daily limits
 * Plugin builds are limited to 10 per day regardless of authentication
 * Can be called as middleware or manually
 */
export function pluginBuildTracker(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const today = new Date().toISOString().split('T')[0];
  const isAuthenticated = !!req.headers['x-user-id'];
  
  const key = `${ip}-${today}`;
  let record = pluginBuildStore.get(key);
  
  // Reset if new day or create new record
  if (!record || record.date !== today) {
    record = {
      ip,
      count: 0,
      date: today,
      isAuthenticated
    };
  }
  
  // Update authentication status
  record.isAuthenticated = isAuthenticated;
  
  // Increment count
  record.count++;
  pluginBuildStore.set(key, record);
  
  // Add build info to response headers
  res.setHeader('X-Plugin-Build-Count', record.count.toString());
  res.setHeader('X-Plugin-Build-Limit', DAILY_LIMIT_PLUGIN_BUILDS.toString());
  res.setHeader('X-Plugin-Build-Remaining', (DAILY_LIMIT_PLUGIN_BUILDS - record.count).toString());
  
  if (next) next();
}

/**
 * Get current plugin build usage for an IP
 */
export function getPluginBuildUsage(ip: string): { count: number; limit: number; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const key = `${ip}-${today}`;
  const record = pluginBuildStore.get(key);
  
  if (!record || record.date !== today) {
    return {
      count: 0,
      limit: DAILY_LIMIT_PLUGIN_BUILDS,
      remaining: DAILY_LIMIT_PLUGIN_BUILDS
    };
  }
  
  return {
    count: record.count,
    limit: DAILY_LIMIT_PLUGIN_BUILDS,
    remaining: Math.max(0, DAILY_LIMIT_PLUGIN_BUILDS - record.count)
  };
}

// Clean up old records every hour
setInterval(() => {
  const today = new Date().toISOString().split('T')[0];
  for (const [key, record] of pluginBuildStore.entries()) {
    if (record.date !== today) {
      pluginBuildStore.delete(key);
    }
  }
}, 60 * 60 * 1000);
