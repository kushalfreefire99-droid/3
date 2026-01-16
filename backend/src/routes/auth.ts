import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { storage, saveStorage } from '../storage/fileStorage.js';
import { discordBot } from '../services/discordBot.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Get environment variables (lazy loaded)
 */
function getOAuthConfig() {
  return {
    CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3002/auth/callback',
    GUILD_ID: process.env.DISCORD_GUILD_ID || '',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key'
  };
}

/**
 * Generate Discord OAuth2 URL
 */
router.get('/discord/url', (req, res) => {
  const { CLIENT_ID, REDIRECT_URI } = getOAuthConfig();
  
  console.log('[AUTH] Discord OAuth URL requested');
  console.log('[AUTH] CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : 'UNDEFINED');
  console.log('[AUTH] REDIRECT_URI:', REDIRECT_URI);
  
  if (!CLIENT_ID) {
    return res.status(500).json({
      success: false,
      error: 'Discord OAuth not configured. CLIENT_ID is missing.'
    });
  }
  
  const state = uuidv4();
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join&state=${state}`;
  
  console.log('[AUTH] Generated OAuth URL');
  
  res.json({
    success: true,
    url,
    state
  });
});

/**
 * Handle Discord OAuth2 callback
 */
router.post('/discord/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, GUILD_ID, JWT_SECRET } = getOAuthConfig();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user information
    const userResponse = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userResponse.data;

    // Check if user is in the server
    let isMember = false;
    try {
      const memberResponse = await axios.get(
        `${DISCORD_API}/users/@me/guilds`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );
      
      isMember = memberResponse.data.some((guild: any) => guild.id === GUILD_ID);
    } catch (error) {
      console.error('[AUTH] Error checking guild membership:', error);
    }

    // If not a member, add them to the server using the bot
    if (!isMember && GUILD_ID) {
      try {
        await discordBot.addMemberToGuild(discordUser.id, access_token);
        isMember = true;
      } catch (error) {
        console.error('[AUTH] Error adding user to guild:', error);
      }
    }

    // Find or create user in storage
    let user = storage.users.find(u => u.discordId === discordUser.id);
    
    if (!user) {
      user = {
        id: uuidv4(),
        discordId: discordUser.id,
        discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
        discordAvatar: discordUser.avatar,
        ipAddress: req.ip || 'unknown',
        isVerified: isMember,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      storage.users.push(user);
    } else {
      user.lastActive = Date.now();
      user.isVerified = isMember;
      user.discordUsername = `${discordUser.username}#${discordUser.discriminator}`;
      user.discordAvatar = discordUser.avatar;
    }

    await saveStorage();

    // Check for active subscription by Discord ID
    const activeSubscription = storage.subscriptions.find(sub => 
      sub.discordId === user.discordId &&
      sub.status === 'active' &&
      sub.expiryDate > Date.now()
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        discordId: user.discordId,
        isVerified: user.isVerified
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.discordUsername,
        avatar: user.discordAvatar,
        isVerified: user.isVerified,
        hasProSubscription: !!activeSubscription,
        subscriptionExpiry: activeSubscription?.expiryDate
      },
      isMember
    });

  } catch (error) {
    console.error('[AUTH] Discord callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Verify JWT token
 */
router.get('/verify', (req, res) => {
  try {
    const { JWT_SECRET } = getOAuthConfig();
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = storage.users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.discordUsername,
        avatar: user.discordAvatar,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export { router as authRouter };
