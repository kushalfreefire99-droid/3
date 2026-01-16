import express from 'express';
import { GenerateRequest, GenerateResponse } from '../types/index.js';
import { GroqProvider } from '../providers/GroqProvider.js';
import { GroqProProvider } from '../providers/GroqProProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { GeminiProProvider } from '../providers/GeminiProProvider.js';
import { HuggingFaceProvider } from '../providers/HuggingFaceProvider.js';
import { AIProviderRouter } from '../providers/AIProviderRouter.js';
import { PromptContextBuilder } from '../utils/promptContextBuilder.js';
import { PromptEnhancer } from '../utils/promptEnhancer.js';
import { perIPLimiter } from '../middleware/rateLimiter.js';
import { usageTracker, getUsage } from '../middleware/usageTracker.js';
import { vpnDetector } from '../middleware/vpnDetector.js';
import { storage, saveStorage } from '../storage/fileStorage.js';
import { discordService } from '../services/discordService.js';
import { discordBot } from '../services/discordBot.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// File extension mapping
const FILE_EXTENSIONS: Record<string, string> = {
  plugin: '.java',
  config: '.yml',
  skript: '.sk',
  datapack: '.json',
  commandblock: '.mcfunction'
};

// Language mapping for syntax highlighting
const LANGUAGES: Record<string, string> = {
  plugin: 'java',
  config: 'yaml',
  skript: 'skript',
  datapack: 'json',
  commandblock: 'mcfunction'
};

/**
 * Adds CodersLab branding to generated code
 */
function addBranding(code: string, resourceType: string): string {
  const branding = '# Made from CodersLab - Join our Discord: https://discord.gg/FYv6kDJg3Y';
  const javaBranding = '// Made from CodersLab - Join our Discord: https://discord.gg/FYv6kDJg3Y';
  
  switch (resourceType) {
    case 'plugin':
      // Add to top of Java file (after package declaration if exists)
      if (code.includes('package ')) {
        const packageEnd = code.indexOf(';', code.indexOf('package ')) + 1;
        return code.slice(0, packageEnd) + '\n\n' + javaBranding + '\n' + code.slice(packageEnd);
      }
      return javaBranding + '\n\n' + code;
      
    case 'config':
    case 'skript':
      // Add to top of YAML/Skript files
      return branding + '\n\n' + code;
      
    case 'datapack':
      // Add to JSON as a comment (not standard but informative)
      if (code.trim().startsWith('{')) {
        return code.replace('{', '{\n  "_comment": "Made from CodersLab - Join our Discord: https://discord.gg/FYv6kDJg3Y",');
      }
      return code;
      
    case 'commandblock':
      // Add as comment at top
      return branding + '\n\n' + code;
      
    default:
      return code;
  }
}

// Lazy initialization of AI providers
function getAIRouter(usePro: boolean = false) {
  if (usePro) {
    // Pro version: Use best models with multiple fallbacks
    const groqProProvider = new GroqProProvider(process.env.GROQ_API_KEY || '');
    const geminiProProvider = new GeminiProProvider(process.env.GEMINI_API_KEY || '');
    const hfProvider = new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY || '');
    return new AIProviderRouter([groqProProvider, geminiProProvider, hfProvider]);
  } else {
    // Free version: Prioritize Groq (faster and better), then Gemini, then HuggingFace
    const groqProvider = new GroqProvider(process.env.GROQ_API_KEY || '');
    const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '');
    const hfProvider = new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY || '');
    return new AIProviderRouter([groqProvider, geminiProvider, hfProvider]);
  }
}

// Get usage endpoint
router.get('/usage', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const isAuthenticated = !!authToken;
  
  // Get Discord ID from token if authenticated
  let discordId: string | undefined;
  if (authToken) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key') as any;
      discordId = decoded.discordId;
    } catch (error) {
      // Invalid token, continue without Discord ID
    }
  }
  
  // Check if user has Pro subscription by Discord ID
  const activeSubscription = discordId ? storage.subscriptions.find(sub => 
    sub.discordId === discordId && 
    sub.status === 'active' && 
    sub.expiryDate > Date.now()
  ) : undefined;
  
  const hasProSubscription = !!activeSubscription;
  
  const usage = getUsage(ip, isAuthenticated, hasProSubscription);
  
  // Add subscription info to response
  res.json({
    ...usage,
    hasProSubscription,
    subscriptionExpiry: activeSubscription?.expiryDate
  });
});

// Enhance prompt endpoint - makes user prompts more detailed and specific
router.post('/enhance-prompt', (req, res) => {
  try {
    const { prompt, resourceType } = req.body;

    if (!prompt || !resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt and resourceType'
      });
    }

    // Use the PromptEnhancer to improve the user's prompt
    const enhancedPrompt = PromptEnhancer.enhance(prompt, resourceType);

    res.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      improvements: [
        'Added technical requirements',
        'Specified advanced features',
        'Included best practices',
        'Added structure guidelines'
      ]
    });
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance prompt'
    });
  }
});

router.post('/generate', vpnDetector, usageTracker, perIPLimiter, async (req, res) => {
  try {
    const { prompt, resourceType, config }: GenerateRequest = req.body;

    // Validate request
    if (!prompt || !resourceType || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, resourceType, and config are required'
      } as GenerateResponse);
    }

    // Validate prompt length
    if (prompt.length < 10 || prompt.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be between 10 and 5000 characters'
      } as GenerateResponse);
    }

    // Check if user wants to use Pro version
    const usePro = req.headers['x-use-pro'] === 'true';

    // Enhance the user prompt for better results
    const enhancedPrompt = PromptEnhancer.enhance(prompt, resourceType);

    // Build context for AI
    const contextString = PromptContextBuilder.build(resourceType, config);
    const context = {
      resourceType,
      minecraftVersion: config.minecraftVersion,
      additionalContext: contextString
    };

    // Generate code using AI router (Pro or Free)
    const aiRouter = getAIRouter(usePro);
    const { code, provider } = await aiRouter.generate(enhancedPrompt, context);

    // Generate filename with CodersLab prefix (lowercase)
    const timestamp = Date.now();
    const sanitizedPrompt = prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `coderslab_${sanitizedPrompt}_${timestamp}${FILE_EXTENSIONS[resourceType]}`;

    // Add CodersLab branding to generated code
    const brandedCode = addBranding(code, resourceType);

    // Save resource to storage
    const resourceId = uuidv4();
    const userIp = req.ip || 'unknown';
    
    const resource = {
      id: resourceId,
      type: resourceType as 'plugin' | 'skript' | 'config',
      name: sanitizedPrompt.replace(/_/g, ' '),
      code: brandedCode,
      filename,
      userId: userIp,
      userIp,
      isPublic: true, // All resources are public for now
      viewCount: 0,
      shareableLink: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/resource/${resourceId}`,
      metadata: {
        prompt,
        ...config,
        provider: usePro ? `${provider}-pro` : provider,
        usedPro: usePro,
        createdAt: timestamp
      },
      createdAt: timestamp
    };

    storage.resources.push(resource);
    storage.stats.totalGenerations++;
    
    // Save to file
    await saveStorage();

    // Post to Discord (try bot first, fallback to webhook) - but NOT for plugins
    // Plugins will be posted only when successfully built
    if (resourceType !== 'plugin') {
      if (discordBot.isConnected()) {
        discordBot.postResource(resource).catch(err => 
          console.error('[DISCORD BOT] Failed to post resource:', err)
        );
      } else {
        discordService.postResource(resource).catch(err => 
          console.error('[DISCORD] Failed to post resource:', err)
        );
      }
    }

    console.log('[GENERATE] Resource created:', resourceId, 'Type:', resourceType, 'Pro:', usePro);

    // Return response
    res.json({
      success: true,
      code: brandedCode,
      filename,
      language: LANGUAGES[resourceType],
      provider: usePro ? `${provider}-pro` : provider,
      resourceId
    } as GenerateResponse);

  } catch (error) {
    console.error('Generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    } as GenerateResponse);
  }
});

// Modify code endpoint
router.post('/modify', vpnDetector, perIPLimiter, async (req, res) => {
  try {
    const { modificationPrompt, currentCode, resourceType } = req.body;

    // Validate request
    if (!modificationPrompt || !currentCode || !resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modificationPrompt, currentCode, and resourceType are required'
      } as GenerateResponse);
    }

    // Validate prompt length
    if (modificationPrompt.length < 3 || modificationPrompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Modification prompt must be between 3 and 1000 characters'
      } as GenerateResponse);
    }

    // Check if this is an auto-fix request (don't count Pro uses for auto-fix)
    const isAutoFix = req.headers['x-auto-fix'] === 'true';
    
    // Check if user wants to use Pro version (but not for auto-fix)
    const usePro = !isAutoFix && req.headers['x-use-pro'] === 'true';
    
    // Only track usage if NOT an auto-fix
    if (!isAutoFix) {
      // Manually call usage tracker
      await new Promise<void>((resolve, reject) => {
        usageTracker(req, res, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Enhance the modification prompt for clean, formal style
    const enhancedModPrompt = PromptEnhancer.enhanceModification(modificationPrompt);

    // Build modification prompt for AI
    const fullPrompt = `${enhancedModPrompt}

Current code:
\`\`\`
${currentCode}
\`\`\`

Please provide ONLY the modified code without any explanations or markdown formatting.`;

    // Generate modified code using AI router (Pro or Free)
    const aiRouter = getAIRouter(usePro);
    const { code, provider } = await aiRouter.generate(fullPrompt, {
      resourceType,
      minecraftVersion: '1.20',
      additionalContext: 'Code modification task'
    });

    // Generate filename with CodersLab prefix (lowercase)
    const timestamp = Date.now();
    const sanitizedPrompt = modificationPrompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `coderslab_${sanitizedPrompt}_${timestamp}${FILE_EXTENSIONS[resourceType]}`;

    // Add CodersLab branding to modified code
    const brandedCode = addBranding(code, resourceType);

    // Return response
    res.json({
      success: true,
      code: brandedCode,
      filename,
      language: LANGUAGES[resourceType],
      provider: usePro ? `${provider}-pro` : provider
    } as GenerateResponse);

  } catch (error) {
    console.error('Modification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    } as GenerateResponse);
  }
});

export { router as generateRouter };
