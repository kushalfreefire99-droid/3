import { Router, Request, Response } from 'express';
import { generateAdminToken, verifyAdminToken, AdminAuthRequest } from '../middleware/adminAuth.js';
import { storage, saveStorage } from '../storage/fileStorage.js';
import { v4 as uuidv4 } from 'uuid';

export const adminRouter = Router();

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
adminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Read credentials dynamically to ensure they're loaded from .env
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
      return;
    }
    
    // Simple password check (no bcrypt needed for simplicity)
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }
    
    // Generate JWT token
    const adminId = 'admin-1';
    const token = generateAdminToken(adminId, username);
    
    res.json({
      success: true,
      token,
      admin: {
        id: adminId,
        username: username
      }
    });
  } catch (error) {
    console.error('[ADMIN] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/logout
 * Admin logout endpoint (client-side token removal)
 */
adminRouter.post('/logout', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  console.log('[ADMIN] Logout for user:', req.adminUsername);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/admin/verify
 * Verify admin token is valid
 */
adminRouter.get('/verify', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  res.json({
    success: true,
    admin: {
      id: req.adminId,
      username: req.adminUsername
    }
  });
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
adminRouter.get('/stats', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  // Update active subscriptions count
  const now = Date.now();
  storage.stats.activeSubscriptions = storage.subscriptions.filter(
    sub => sub.status === 'active' && sub.expiryDate > now
  ).length;
  
  storage.stats.totalUsers = storage.users.length;
  
  res.json({
    success: true,
    stats: storage.stats
  });
});

/**
 * GET /api/admin/config
 * Get configuration
 */
adminRouter.get('/config', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  res.json({
    success: true,
    config: storage.config
  });
});

/**
 * PUT /api/admin/config
 * Update configuration
 */
adminRouter.put('/config', verifyAdminToken, async (req: AdminAuthRequest, res: Response) => {
  try {
    const updates = req.body;
    
    // Update config
    storage.config = { ...storage.config, ...updates };
    
    // Save to file
    await saveStorage();
    
    console.log('[ADMIN] Config updated by:', req.adminUsername);
    
    res.json({
      success: true,
      config: storage.config
    });
  } catch (error) {
    console.error('[ADMIN] Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

/**
 * GET /api/admin/subscriptions
 * Get all subscriptions
 */
adminRouter.get('/subscriptions', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  res.json({
    success: true,
    subscriptions: storage.subscriptions
  });
});

/**
 * POST /api/admin/subscriptions
 * Grant subscription to user by Discord username
 */
adminRouter.post('/subscriptions', verifyAdminToken, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { discordUsername, durationDays } = req.body;
    
    if (!discordUsername) {
      res.status(400).json({
        success: false,
        error: 'Discord username is required'
      });
      return;
    }
    
    // Find user by Discord username
    const user = storage.users.find(u => 
      u.discordUsername?.toLowerCase() === discordUsername.toLowerCase()
    );
    
    if (!user || !user.discordId) {
      res.status(404).json({
        success: false,
        error: 'User not found. User must login with Discord first.'
      });
      return;
    }
    
    // Check if user already has an active subscription
    const existingSubscription = storage.subscriptions.find(sub =>
      sub.discordId === user.discordId &&
      sub.status === 'active' &&
      sub.expiryDate > Date.now()
    );
    
    if (existingSubscription) {
      res.status(400).json({
        success: false,
        error: 'User already has an active subscription'
      });
      return;
    }
    
    const duration = durationDays || storage.config.subscriptionDurationDays;
    const startDate = Date.now();
    const expiryDate = startDate + (duration * 24 * 60 * 60 * 1000);
    
    const subscription = {
      id: uuidv4(),
      userId: user.id,
      discordId: user.discordId,
      discordUsername: user.discordUsername || discordUsername,
      startDate,
      expiryDate,
      status: 'active' as const,
      price: storage.config.subscriptionPrice
    };
    
    storage.subscriptions.push(subscription);
    
    await saveStorage();
    
    console.log('[ADMIN] Subscription granted to:', discordUsername, 'by:', req.adminUsername);
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('[ADMIN] Subscription grant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant subscription'
    });
  }
});

/**
 * DELETE /api/admin/subscriptions/:id
 * Revoke subscription
 */
adminRouter.delete('/subscriptions/:id', verifyAdminToken, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const subscription = storage.subscriptions.find(sub => sub.id === id);
    
    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
      return;
    }
    
    subscription.status = 'expired';
    
    await saveStorage();
    
    console.log('[ADMIN] Subscription revoked:', id, 'by:', req.adminUsername);
    
    res.json({
      success: true,
      message: 'Subscription revoked'
    });
  } catch (error) {
    console.error('[ADMIN] Subscription revoke error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke subscription'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
adminRouter.get('/users', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  const users = storage.users.map(user => {
    // Check if user has active subscription
    const hasSubscription = storage.subscriptions.some(sub =>
      sub.discordId === user.discordId &&
      sub.status === 'active' &&
      sub.expiryDate > Date.now()
    );
    
    return {
      id: user.id,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      hasSubscription
    };
  });
  
  res.json({
    success: true,
    users
  });
});

/**
 * GET /api/admin/resources
 * Get all resources
 */
adminRouter.get('/resources', verifyAdminToken, (req: AdminAuthRequest, res: Response) => {
  res.json({
    success: true,
    resources: storage.resources
  });
});
