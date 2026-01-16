import { Request, Response, NextFunction } from 'express';

interface UsageRecord {
  ip: string;
  count: number;
  proCount: number;
  date: string;
  isAuthenticated: boolean;
  hasProSubscription: boolean;
}

// In-memory storage (in production, use Redis or database)
const usageStore = new Map<string, UsageRecord>();

const DAILY_LIMIT_UNAUTHENTICATED = 3;
const DAILY_LIMIT_AUTHENTICATED = 50;
const DAILY_LIMIT_PRO_VERIFIED = 3; // Pro uses for all verified users
const DAILY_LIMIT_PRO_SUBSCRIBED = 50; // Pro uses for subscribed users

/**
 * Tracks usage per IP address with daily limits
 * Supports both regular and Pro usage tracking
 */
export function usageTracker(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const today = new Date().toISOString().split('T')[0];
  
  // Check if user is authenticated via JWT token or x-user-id header
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const userId = req.headers['x-user-id'];
  const isAuthenticated = !!(authToken || userId);
  
  // Check if this is a Pro request
  const isPro = req.headers['x-use-pro'] === 'true';
  
  // Check if user has Pro subscription (would come from database in production)
  const hasProSubscription = req.headers['x-has-pro-subscription'] === 'true';
  
  const key = `${ip}-${today}`;
  let record = usageStore.get(key);
  
  // Reset if new day or create new record
  if (!record || record.date !== today) {
    record = {
      ip,
      count: 0,
      proCount: 0,
      date: today,
      isAuthenticated,
      hasProSubscription
    };
  }
  
  // Update authentication status
  record.isAuthenticated = isAuthenticated;
  record.hasProSubscription = hasProSubscription;
  
  // Check limits based on request type
  if (isPro) {
    // Pro request - all verified users get 3 Pro uses, subscribers get 50
    const proLimit = hasProSubscription ? DAILY_LIMIT_PRO_SUBSCRIBED : (isAuthenticated ? DAILY_LIMIT_PRO_VERIFIED : 0);
    
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Pro version requires Discord authentication. Please login to continue.',
        requiresAuth: true
      });
    }
    
    if (record.proCount >= proLimit) {
      return res.status(429).json({
        success: false,
        error: hasProSubscription
          ? `Daily Pro limit of ${DAILY_LIMIT_PRO_SUBSCRIBED} requests reached. Please try again tomorrow.`
          : `Daily Pro limit of ${DAILY_LIMIT_PRO_VERIFIED} requests reached. Upgrade to Pro subscription for ${DAILY_LIMIT_PRO_SUBSCRIBED} daily Pro uses.`,
        requiresProSubscription: !hasProSubscription,
        usageCount: record.proCount,
        dailyLimit: proLimit
      });
    }
    
    // Increment Pro count
    record.proCount++;
    usageStore.set(key, record);
    
    // Add Pro usage info to response headers
    res.setHeader('X-Pro-Usage-Count', record.proCount.toString());
    res.setHeader('X-Pro-Usage-Limit', proLimit.toString());
    res.setHeader('X-Pro-Usage-Remaining', (proLimit - record.proCount).toString());
  } else {
    // Regular request
    const limit = isAuthenticated ? DAILY_LIMIT_AUTHENTICATED : DAILY_LIMIT_UNAUTHENTICATED;
    
    if (record.count >= limit) {
      return res.status(429).json({
        success: false,
        error: isAuthenticated 
          ? `Daily limit of ${DAILY_LIMIT_AUTHENTICATED} requests reached. Please try again tomorrow.`
          : `Free tier limit of ${DAILY_LIMIT_UNAUTHENTICATED} requests reached. Please login with Discord to continue.`,
        requiresAuth: !isAuthenticated,
        usageCount: record.count,
        dailyLimit: limit
      });
    }
    
    // Increment count
    record.count++;
    usageStore.set(key, record);
    
    // Add usage info to response headers
    res.setHeader('X-Usage-Count', record.count.toString());
    res.setHeader('X-Usage-Limit', limit.toString());
    res.setHeader('X-Usage-Remaining', (limit - record.count).toString());
  }
  
  next();
}

/**
 * Get current usage for an IP with authentication check
 * Returns both regular and Pro usage
 */
export function getUsage(ip: string, isAuthenticated: boolean = false, hasProSubscription: boolean = false): { 
  count: number; 
  limit: number; 
  remaining: number; 
  requiresAuth: boolean;
  proCount: number;
  proLimit: number;
  proRemaining: number;
  hasProSubscription: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  const key = `${ip}-${today}`;
  const record = usageStore.get(key);
  
  const limit = isAuthenticated ? DAILY_LIMIT_AUTHENTICATED : DAILY_LIMIT_UNAUTHENTICATED;
  const proLimit = hasProSubscription ? DAILY_LIMIT_PRO_SUBSCRIBED : (isAuthenticated ? DAILY_LIMIT_PRO_VERIFIED : 0);
  
  if (!record || record.date !== today) {
    return {
      count: 0,
      limit,
      remaining: limit,
      requiresAuth: false,
      proCount: 0,
      proLimit,
      proRemaining: proLimit,
      hasProSubscription
    };
  }
  
  return {
    count: record.count,
    limit,
    remaining: Math.max(0, limit - record.count),
    requiresAuth: record.count >= DAILY_LIMIT_UNAUTHENTICATED && !record.isAuthenticated && !isAuthenticated,
    proCount: record.proCount,
    proLimit,
    proRemaining: Math.max(0, proLimit - record.proCount),
    hasProSubscription: record.hasProSubscription || hasProSubscription
  };
}

// Clean up old records every hour
setInterval(() => {
  const today = new Date().toISOString().split('T')[0];
  for (const [key, record] of usageStore.entries()) {
    if (record.date !== today) {
      usageStore.delete(key);
    }
  }
}, 60 * 60 * 1000);
