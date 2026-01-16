import axios from 'axios';
import { GenerateRequest, GenerateResponse, HealthResponse } from '../types/index';

const API_BASE_URL = '/api';

/**
 * Generates code using the backend API
 */
export async function generateCode(request: GenerateRequest, usePro: boolean = false): Promise<GenerateResponse> {
  try {
    const userId = localStorage.getItem('discord_user_id');
    const token = localStorage.getItem('discord_auth_token');
    
    // Check if user has Pro subscription
    const hasProSubscription = localStorage.getItem('has_pro_subscription') === 'true';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (userId && token) {
      headers['x-user-id'] = userId;
      headers['x-auth-token'] = token;
    }
    
    // Add Pro mode header
    if (usePro) {
      headers['x-use-pro'] = 'true';
      headers['x-has-pro-subscription'] = hasProSubscription ? 'true' : 'false';
    }
    
    const response = await axios.post<GenerateResponse>(
      `${API_BASE_URL}/generate`,
      request,
      { 
        timeout: usePro ? 90000 : 60000, // Longer timeout for Pro
        headers
      }
    );
    
    // Dispatch usage update event for real-time counter update
    if (response.data.success) {
      window.dispatchEvent(new Event('usageUpdated'));
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        return error.response.data as GenerateResponse;
      }
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please try again.'
        };
      }
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection.'
        };
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred.'
    };
  }
}

/**
 * Modifies existing code using AI based on a modification prompt
 */
export async function modifyCode(modificationPrompt: string, currentCode: string, resourceType: string, usePro: boolean = false, isAutoFix: boolean = false): Promise<GenerateResponse> {
  try {
    const userId = localStorage.getItem('discord_user_id');
    const token = localStorage.getItem('discord_auth_token');
    
    // Check if user has Pro subscription
    const hasProSubscription = localStorage.getItem('has_pro_subscription') === 'true';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (userId && token) {
      headers['x-user-id'] = userId;
      headers['x-auth-token'] = token;
    }
    
    // Add auto-fix header (auto-fix doesn't count Pro uses)
    if (isAutoFix) {
      headers['x-auto-fix'] = 'true';
    }
    
    // Add Pro mode header (but not for auto-fix)
    if (usePro && !isAutoFix) {
      headers['x-use-pro'] = 'true';
      headers['x-has-pro-subscription'] = hasProSubscription ? 'true' : 'false';
    }
    
    const response = await axios.post<GenerateResponse>(
      `${API_BASE_URL}/modify`,
      { modificationPrompt, currentCode, resourceType },
      { 
        timeout: usePro ? 90000 : 60000, // Longer timeout for Pro
        headers
      }
    );
    
    // Dispatch usage update event for real-time counter update (but not for auto-fix)
    if (response.data.success && !isAutoFix) {
      window.dispatchEvent(new Event('usageUpdated'));
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        return error.response.data as GenerateResponse;
      }
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please try again.'
        };
      }
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection.'
        };
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred.'
    };
  }
}

/**
 * Checks the health status of the API
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await axios.get<HealthResponse>(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    return {
      status: 'degraded',
      providers: {
        groq: 'unavailable',
        gemini: 'unavailable',
        huggingface: 'unavailable'
      }
    };
  }
}

/**
 * Builds a plugin and returns the JAR file
 */
export async function buildPlugin(config: {
  pluginName: string;
  version: string;
  minecraftVersion: string;
  apiType: string;
  mainClass: string;
  javaCode: string;
  dependencies?: string[];
}): Promise<Blob> {
  const response = await axios.post(
    `${API_BASE_URL}/build/plugin`,
    config,
    {
      responseType: 'blob',
      timeout: 120000 // 2 minutes for compilation
    }
  );
  return response.data;
}

/**
 * Gets plugin build usage
 */
export async function getBuildUsage(): Promise<{ count: number; limit: number; remaining: number }> {
  const response = await axios.get(`${API_BASE_URL}/build/usage`);
  return response.data;
}

/**
 * Generates all plugin files without building
 */
export async function generatePluginFiles(config: {
  pluginName: string;
  version: string;
  minecraftVersion: string;
  apiType: string;
  mainClass: string;
  javaCode: string;
}): Promise<{ success: boolean; files?: Array<{ name: string; content: string; type: string }>; error?: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/build/files`, config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      error: 'Failed to generate plugin files'
    };
  }
}

/**
 * Enhances a user prompt to be more detailed and specific
 */
export async function enhancePrompt(prompt: string, resourceType: string): Promise<{
  success: boolean;
  originalPrompt?: string;
  enhancedPrompt?: string;
  improvements?: string[];
  error?: string;
}> {
  try {
    const response = await axios.post(`${API_BASE_URL}/enhance-prompt`, {
      prompt,
      resourceType
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      error: 'Failed to enhance prompt'
    };
  }
}
