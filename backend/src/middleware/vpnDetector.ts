import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

// Cache for VPN check results (1 hour TTL)
const vpnCache = new Map<string, { isVPN: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Detects if request is coming from a VPN/proxy
 * Uses multiple detection methods
 */
export async function vpnDetector(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Skip for localhost/development
  if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return next();
  }
  
  // Check cache
  const cached = vpnCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (cached.isVPN) {
      return res.status(403).json({
        success: false,
        error: 'VPN/Proxy detected. Please disable your VPN to use this service.',
        code: 'VPN_DETECTED'
      });
    }
    return next();
  }
  
  try {
    // Method 1: Check for common VPN/proxy headers
    const suspiciousHeaders = [
      req.headers['x-forwarded-for'],
      req.headers['x-real-ip'],
      req.headers['via'],
      req.headers['x-proxy-id']
    ].filter(Boolean);
    
    if (suspiciousHeaders.length > 2) {
      vpnCache.set(ip, { isVPN: true, timestamp: Date.now() });
      return res.status(403).json({
        success: false,
        error: 'VPN/Proxy detected. Please disable your VPN to use this service.',
        code: 'VPN_DETECTED'
      });
    }
    
    // Method 2: Basic IP reputation check (you can integrate with services like IPHub, IPQualityScore, etc.)
    // For now, we'll use a simple heuristic
    const isVPN = await checkIPReputation(ip);
    
    vpnCache.set(ip, { isVPN, timestamp: Date.now() });
    
    if (isVPN) {
      return res.status(403).json({
        success: false,
        error: 'VPN/Proxy detected. Please disable your VPN to use this service.',
        code: 'VPN_DETECTED'
      });
    }
    
    next();
  } catch (error) {
    // On error, allow the request (fail open)
    console.error('VPN detection error:', error);
    next();
  }
}

/**
 * Check IP reputation (basic implementation)
 * In production, integrate with a proper VPN detection API
 */
async function checkIPReputation(ip: string): Promise<boolean> {
  try {
    // You can integrate with services like:
    // - IPHub.info
    // - IPQualityScore
    // - ProxyCheck.io
    // For now, return false (not a VPN) to avoid blocking legitimate users
    return false;
  } catch {
    return false;
  }
}

// Clean up old cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of vpnCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      vpnCache.delete(ip);
    }
  }
}, 60 * 60 * 1000);
