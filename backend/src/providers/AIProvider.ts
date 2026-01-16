import { PromptContext, RateLimitStatus } from '../types/index.js';

/**
 * Base interface for AI code generation providers
 */
export interface AIProvider {
  name: string;
  generate(prompt: string, context: PromptContext): Promise<string>;
  isAvailable(): Promise<boolean>;
  getRateLimitStatus(): RateLimitStatus;
}

/**
 * Base class for AI providers with common functionality
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected rateLimitStatus: RateLimitStatus = {
    remaining: 1000,
    resetTime: Date.now() + 3600000
  };

  abstract generate(prompt: string, context: PromptContext): Promise<string>;
  abstract isAvailable(): Promise<boolean>;

  getRateLimitStatus(): RateLimitStatus {
    return this.rateLimitStatus;
  }

  /**
   * Extracts code from markdown code blocks if present
   */
  protected extractCode(response: string): string {
    // Check if response contains markdown code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      // Return the content of the first code block
      return matches[0][1].trim();
    }
    
    // If no code blocks, return the response as-is
    return response.trim();
  }
}
