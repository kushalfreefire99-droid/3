import axios, { AxiosError } from 'axios';
import { BaseAIProvider } from './AIProvider.js';
import { PromptContext } from '../types/index.js';

/**
 * Hugging Face AI provider implementation
 * Fallback provider using Hugging Face Inference API
 */
export class HuggingFaceProvider extends BaseAIProvider {
  name = 'huggingface';
  private apiKey: string;
  private model = 'mistralai/Mistral-7B-Instruct-v0.3';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async generate(prompt: string, context: PromptContext): Promise<string> {
    try {
      const fullPrompt = this.buildPrompt(prompt, context);
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.model}`,
        {
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      let generatedText: string;
      if (Array.isArray(response.data)) {
        generatedText = response.data[0].generated_text || response.data[0];
      } else {
        generatedText = response.data.generated_text || response.data;
      }

      return this.extractCode(generatedText);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (axiosError.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        if (axiosError.response?.status === 503) {
          throw new Error('Model is loading, please try again');
        }
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        }
      }
      throw new Error(`Hugging Face API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`https://api-inference.huggingface.co/models/${this.model}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  private buildPrompt(prompt: string, context: PromptContext): string {
    return `${context.additionalContext}\n\nUser request: ${prompt}`;
  }
}
