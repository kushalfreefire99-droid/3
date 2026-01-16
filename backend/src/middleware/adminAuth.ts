import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface AdminAuthRequest extends Request {
  adminId?: string;
  adminUsername?: string;
}

/**
 * Middleware to verify admin JWT token
 */
export function verifyAdminToken(req: AdminAuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; username: string };
      
      // Attach admin info to request
      req.adminId = decoded.adminId;
      req.adminUsername = decoded.username;
      
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          expired: true
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }
  } catch (error) {
    console.error('[AUTH] Error verifying admin token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(adminId: string, username: string): string {
  return jwt.sign(
    { adminId, username },
    JWT_SECRET,
    { expiresIn: '24h' } // Token expires in 24 hours
  );
}
