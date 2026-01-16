import axios, { AxiosError } from 'axios';
import { BaseAIProvider } from './AIProvider.js';
import { PromptContext } from '../types/index.js';

/**
 * Groq Pro AI provider implementation
 * Uses the best available model for premium quality code generation
 */
export class GroqProProvider extends BaseAIProvider {
  name = 'groq-pro';
  private apiKey: string;
  private baseURL = 'https://api.groq.com/openai/v1';
  private model = 'llama-3.3-70b-versatile'; // Best quality model for Pro users (updated from deprecated 3.1)

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
    console.log('Groq Pro Provider initialized with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  }

  async generate(prompt: string, context: PromptContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7, // Higher temperature for more creative, detailed responses
          max_tokens: 4096, // More tokens for comprehensive code
          top_p: 0.95, // Higher top_p for better quality
          frequency_penalty: 0.2, // Reduce repetition
          presence_penalty: 0.1 // Encourage diverse content
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // Longer timeout for better quality
        }
      );

      const generatedText = response.data.choices[0].message.content;
      return this.extractCode(generatedText);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Groq Pro API Error Details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          code: axiosError.code
        });
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (axiosError.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        }
      }
      throw new Error(`Groq Pro API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  private buildSystemPrompt(context: PromptContext): string {
    return context.additionalContext;
  }
}
