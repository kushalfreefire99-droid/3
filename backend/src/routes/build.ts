import express from 'express';
import { MavenBuilder, PluginBuildConfig } from '../utils/mavenBuilder.js';
import { pluginBuildTracker, getPluginBuildUsage } from '../middleware/pluginBuildTracker.js';
import { vpnDetector } from '../middleware/vpnDetector.js';
import { perIPLimiter } from '../middleware/rateLimiter.js';
import { storage, saveStorage } from '../storage/fileStorage.js';
import { discordBot } from '../services/discordBot.js';

const router = express.Router();

// Store for build progress (in-memory, could be Redis in production)
const buildProgress = new Map<string, { progress: number; stage: string; eta: number }>();

// Get plugin build usage endpoint
router.get('/usage', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const usage = getPluginBuildUsage(ip);
  res.json(usage);
});

// SSE endpoint for build progress
router.get('/progress/:buildId', (req, res) => {
  const { buildId } = req.params;
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ progress: 0, stage: 'Initializing', eta: 45 })}\n\n`);
  
  // Check for progress updates every 500ms
  const interval = setInterval(() => {
    const progress = buildProgress.get(buildId);
    if (progress) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
      
      // Close connection when build is complete
      if (progress.progress >= 100) {
        clearInterval(interval);
        buildProgress.delete(buildId);
        res.end();
      }
    }
  }, 500);
  
  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    buildProgress.delete(buildId);
  });
});

// Build plugin endpoint
router.post('/plugin', vpnDetector, perIPLimiter, async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  let buildSucceeded = false;
  
  try {
    const { pluginName, version, minecraftVersion, apiType, mainClass, javaCode, dependencies } = req.body;

    // Validate request
    if (!pluginName || !version || !minecraftVersion || !apiType || !mainClass || !javaCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pluginName, version, minecraftVersion, apiType, mainClass, and javaCode are required'
      });
    }

    // Check build usage BEFORE incrementing (we'll increment only on success)
    const usage = getPluginBuildUsage(ip);
    if (usage.count >= usage.limit) {
      return res.status(429).json({
        success: false,
        error: `Daily plugin build limit of ${usage.limit} reached. Plugin compilation is resource-intensive. Please try again tomorrow.`,
        buildCount: usage.count,
        dailyLimit: usage.limit,
        resetTime: 'midnight UTC'
      });
    }

    // Check if Maven is installed
    const mavenInstalled = await MavenBuilder.isMavenInstalled();
    if (!mavenInstalled) {
      return res.status(503).json({
        success: false,
        error: 'Maven is not installed on the server. Plugin compilation is currently unavailable. Please download the source code instead.'
      });
    }

    // Generate unique build ID
    const buildId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Build configuration
    const config: PluginBuildConfig = {
      pluginName,
      version,
      minecraftVersion,
      apiType,
      mainClass,
      javaCode,
      dependencies
    };

    // Build the plugin with progress tracking
    const builder = new MavenBuilder();
    const { jarBuffer } = await builder.buildPlugin(config, (progress, stage, eta) => {
      buildProgress.set(buildId, { progress, stage, eta });
    });

    // Mark build as successful
    buildSucceeded = true;
    
    // NOW increment build usage (only on success)
    pluginBuildTracker(req, res, () => {});

    // Track build stats
    storage.stats.totalBuilds++;
    await saveStorage();

    // Post JAR to Discord bot if connected
    if (discordBot.isConnected()) {
      // Find the most recent plugin resource for this code
      let recentResource = storage.resources
        .filter(r => r.type === 'plugin' && r.code.includes(mainClass))
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      
      // If no matching resource found, create a temporary one for Discord posting
      if (!recentResource) {
        const timestamp = Date.now();
        const sanitizedName = pluginName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        recentResource = {
          id: `build-${timestamp}`,
          type: 'plugin' as const,
          name: pluginName,
          code: javaCode,
          filename: `coderslab_${sanitizedName}_${timestamp}.java`,
          userId: req.ip || 'unknown',
          userIp: req.ip || 'unknown',
          isPublic: true,
          viewCount: 0,
          shareableLink: '',
          metadata: {
            prompt: `Built plugin: ${pluginName}`,
            minecraftVersion,
            pluginAPI: apiType,
            provider: 'build',
            createdAt: timestamp
          },
          createdAt: timestamp
        };
      }
      
      // Post to Discord with JAR file
      discordBot.postResource(recentResource, jarBuffer).catch(err =>
        console.error('[DISCORD BOT] Failed to post JAR:', err)
      );
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/java-archive');
    res.setHeader('Content-Disposition', `attachment; filename="coderslab_${pluginName.toLowerCase()}_${version}.jar"`);
    res.setHeader('Content-Length', jarBuffer.length.toString());
    res.setHeader('X-Build-Id', buildId);

    // Send JAR file
    res.send(jarBuffer);

  } catch (error) {
    console.error('Plugin build error:', error);
    
    // Build failed - don't count usage (buildSucceeded is still false)
    
    let errorMessage = 'Plugin build failed. Please try again.';
    let detailedError = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Try to extract detailed Maven output from the error
      if ('stdout' in error) {
        detailedError = (error as any).stdout || '';
      }
      if ('stderr' in error) {
        detailedError += '\n' + ((error as any).stderr || '');
      }
      
      // If no stdout/stderr, use the full error message
      if (!detailedError) {
        detailedError = error.stack || error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: detailedError.trim()
    });
  }
});

// Generate plugin files endpoint (without building)
router.post('/files', vpnDetector, perIPLimiter, async (req, res) => {
  try {
    const { pluginName, version, minecraftVersion, apiType, mainClass, javaCode } = req.body;

    // Validate request
    if (!pluginName || !version || !minecraftVersion || !apiType || !mainClass || !javaCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const builder = new MavenBuilder();
    const files = await builder.generateAllFiles({
      pluginName,
      version,
      minecraftVersion,
      apiType,
      mainClass,
      javaCode
    });

    res.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('File generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate plugin files'
    });
  }
});

export { router as buildRouter };
