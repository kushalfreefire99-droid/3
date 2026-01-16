// Core resource types supported by the system
export type ResourceType = 'plugin' | 'config' | 'skript' | 'datapack' | 'commandblock';

// Configuration options for code generation
export interface GenerationConfig {
  minecraftVersion: string;
  pluginAPI?: 'spigot' | 'paper' | 'bukkit';
  skriptVersion?: string;
}

// Represents a single code generation instance
export interface Generation {
  id: string;
  timestamp: number;
  prompt: string;
  resourceType: ResourceType;
  code: string;
  filename: string;
  language: string;
  config: GenerationConfig;
}

// Metadata for each resource type
export interface ResourceTypeMetadata {
  type: ResourceType;
  displayName: string;
  description: string;
  fileExtension: string;
  language: string;
  examplePrompts: string[];
  defaultConfig: Partial<GenerationConfig>;
}

// Resource type metadata constant
export const RESOURCE_TYPES: Record<ResourceType, ResourceTypeMetadata> = {
  plugin: {
    type: 'plugin',
    displayName: 'Bukkit/Spigot Plugin',
    description: 'Java plugin for Bukkit, Spigot, or Paper servers',
    fileExtension: '.java',
    language: 'java',
    examplePrompts: [
      'Create a plugin that teleports players to spawn on death',
      'Make a plugin that adds custom enchantments',
      'Build an economy plugin with shops and currency'
    ],
    defaultConfig: { pluginAPI: 'spigot', minecraftVersion: '1.20' }
  },
  config: {
    type: 'config',
    displayName: 'Configuration File',
    description: 'YAML or JSON configuration file',
    fileExtension: '.yml',
    language: 'yaml',
    examplePrompts: [
      'Create a config for a shop plugin with item prices',
      'Make a permissions config for different ranks',
      'Build a world generation config'
    ],
    defaultConfig: { minecraftVersion: '1.20' }
  },
  skript: {
    type: 'skript',
    displayName: 'Skript Script',
    description: 'Skript addon script for easy server customization',
    fileExtension: '.sk',
    language: 'skript',
    examplePrompts: [
      'Create a skript for custom join messages',
      'Make a voting rewards skript',
      'Build a minigame skript with teams'
    ],
    defaultConfig: { skriptVersion: '2.8', minecraftVersion: '1.20' }
  },
  datapack: {
    type: 'datapack',
    displayName: 'Data Pack',
    description: 'Vanilla Minecraft data pack',
    fileExtension: '.json',
    language: 'json',
    examplePrompts: [
      'Create a datapack with custom crafting recipes',
      'Make a datapack that adds new advancements',
      'Build a datapack with custom loot tables'
    ],
    defaultConfig: { minecraftVersion: '1.20' }
  },
  commandblock: {
    type: 'commandblock',
    displayName: 'Command Block Script',
    description: 'Minecraft commands for command blocks',
    fileExtension: '.mcfunction',
    language: 'mcfunction',
    examplePrompts: [
      'Create commands for a parkour timer',
      'Make commands for a shop system',
      'Build commands for a teleportation hub'
    ],
    defaultConfig: { minecraftVersion: '1.20' }
  }
};

// User preferences stored in localStorage
export interface UserPreferences {
  defaultMinecraftVersion: string;
  defaultPluginAPI: 'spigot' | 'paper' | 'bukkit';
  defaultSkriptVersion: string;
  theme: 'light' | 'dark';
}

// LocalStorage schema
export interface LocalStorageSchema {
  generations: Generation[];
  preferences: UserPreferences;
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

// Plugin file types
export interface PluginFile {
  name: string;
  content: string;
  type: string;
}

export interface PluginFilesResponse {
  success: boolean;
  files?: PluginFile[];
  error?: string;
}
