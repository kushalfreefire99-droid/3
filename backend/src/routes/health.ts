import express from 'express';
import { HealthResponse } from '../types/index.js';
import { GroqProvider } from '../providers/GroqProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { HuggingFaceProvider } from '../providers/HuggingFaceProvider.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Initialize providers with current environment variables
    const groqProvider = new GroqProvider(process.env.GROQ_API_KEY || '');
    const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '');
    const hfProvider = new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY || '');

    // Check provider availability
    const [groqAvailable, geminiAvailable, hfAvailable] = await Promise.all([
      groqProvider.isAvailable().catch(() => false),
      geminiProvider.isAvailable().catch(() => false),
      hfProvider.isAvailable().catch(() => false)
    ]);

    const response: HealthResponse = {
      status: (groqAvailable || geminiAvailable || hfAvailable) ? 'ok' : 'degraded',
      providers: {
        groq: groqAvailable ? 'available' : 'unavailable',
        gemini: geminiAvailable ? 'available' : 'unavailable',
        huggingface: hfAvailable ? 'available' : 'unavailable'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'degraded',
      providers: {
        groq: 'unavailable',
        gemini: 'unavailable',
        huggingface: 'unavailable'
      }
    } as HealthResponse);
  }
});

export { router as healthRouter };
