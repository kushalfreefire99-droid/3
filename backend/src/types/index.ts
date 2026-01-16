// Core resource types supported by the system
export type ResourceType = 'plugin' | 'config' | 'skript' | 'datapack' | 'commandblock';

// Configuration options for code generation
export interface GenerationConfig {
  minecraftVersion: string;
  pluginAPI?: 'spigot' | 'paper' | 'bukkit';
  skriptVersion?: string;
}

// API request/response types
export interface GenerateRequest {
  prompt: string;
  resourceType: ResourceType;
  config: GenerationConfig;
}

export interface GenerateResponse {
  success: boolean;
  code?: string;
  filename?: string;
  language?: string;
  error?: string;
  provider?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  providers: {
    groq: 'available' | 'rate_limited' | 'unavailable';
    gemini: 'available' | 'rate_limited' | 'unavailable';
    huggingface: 'available' | 'rate_limited' | 'unavailable';
  };
}

// AI Provider interfaces
export interface PromptContext {
  resourceType: ResourceType;
  minecraftVersion: string;
  additionalContext: string;
}

export interface RateLimitStatus {
  remaining: number;
  resetTime: number;
}

export interface AIProvider {
  name: string;
  generate(prompt: string, context: PromptContext): Promise<string>;
  isAvailable(): Promise<boolean>;
  getRateLimitStatus(): RateLimitStatus;
}

// Rate limiting data
export interface RateLimitData {
  ip: string;
  requests: number;
  windowStart: number;
  blocked: boolean;
}
