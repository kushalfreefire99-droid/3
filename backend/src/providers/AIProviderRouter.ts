import { AIProvider } from './AIProvider.js';
import { PromptContext } from '../types/index.js';

/**
 * Routes AI generation requests to available providers with fallback logic
 */
export class AIProviderRouter {
  private providers: AIProvider[];
  private currentProviderIndex = 0;

  constructor(providers: AIProvider[]) {
    this.providers = providers;
  }

  /**
   * Generates code using the first available provider, with automatic fallback
   */
  async generate(prompt: string, context: PromptContext): Promise<{ code: string; provider: string }> {
    const errors: string[] = [];

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        console.log(`Attempting generation with provider: ${provider.name}`);
        const code = await provider.generate(prompt, context);
        return { code, provider: provider.name };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Provider ${provider.name} failed:`, errorMessage);
        errors.push(`${provider.name}: ${errorMessage}`);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Errors: ${errors.join('; ')}`);
  }

  /**
   * Checks availability of all providers
   */
  async checkProviderStatus(): Promise<Record<string, 'available' | 'unavailable'>> {
    const status: Record<string, 'available' | 'unavailable'> = {};

    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const available = await provider.isAvailable();
          status[provider.name] = available ? 'available' : 'unavailable';
        } catch {
          status[provider.name] = 'unavailable';
        }
      })
    );

    return status;
  }

  /**
   * Gets rate limit status for all providers
   */
  getProviderRateLimits(): Record<string, { remaining: number; resetTime: number }> {
    const limits: Record<string, { remaining: number; resetTime: number }> = {};
    
    this.providers.forEach(provider => {
      const status = provider.getRateLimitStatus();
      limits[provider.name] = status;
    });

    return limits;
  }
}
