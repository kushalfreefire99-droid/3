import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { PromptContextBuilder } from './promptContextBuilder.js';
import { ResourceType, GenerationConfig } from '../types/index.js';

describe('PromptContextBuilder', () => {
  const resourceTypeArb = fc.constantFrom<ResourceType>(
    'plugin', 'config', 'skript', 'datapack', 'commandblock'
  );

  const configArb = fc.record({
    minecraftVersion: fc.constantFrom('1.19', '1.20', '1.21'),
    pluginAPI: fc.option(fc.constantFrom('spigot', 'paper', 'bukkit')),
    skriptVersion: fc.option(fc.constantFrom('2.7', '2.8', '2.9'))
  }) as fc.Arbitrary<GenerationConfig>;

  // Feature: minecraft-code-generator, Property 26: Comprehensive prompt context
  test('all generation requests include resource type, best practices, comments request, and formatting preferences', () => {
    fc.assert(
      fc.property(
        resourceTypeArb,
        configArb,
        (resourceType, config) => {
          const context = PromptContextBuilder.build(resourceType, config);

          // Verify resource type is mentioned
          expect(context.toLowerCase()).toContain(resourceType.toLowerCase());

          // Verify best practices are mentioned
          expect(context.toLowerCase()).toContain('best practices');

          // Verify comments are requested
          expect(context.toLowerCase()).toContain('comment');

          // Verify formatting preferences are specified
          expect(context.toLowerCase()).toContain('format');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('context includes Minecraft version for all resource types', () => {
    fc.assert(
      fc.property(
        resourceTypeArb,
        configArb,
        (resourceType, config) => {
          const context = PromptContextBuilder.build(resourceType, config);
          expect(context).toContain(config.minecraftVersion);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Plugin-Specific Context', () => {
  // Feature: minecraft-code-generator, Property 25: Minecraft version in plugin prompts
  test('plugin generation includes Minecraft version in prompt', () => {
    fc.assert(
      fc.property(
        fc.record({
          minecraftVersion: fc.constantFrom('1.19', '1.20', '1.21'),
          pluginAPI: fc.constantFrom('spigot', 'paper', 'bukkit')
        }) as fc.Arbitrary<GenerationConfig>,
        (config) => {
          const context = PromptContextBuilder.build('plugin', config);
          
          // Verify Minecraft version is included
          expect(context).toContain(config.minecraftVersion);
          expect(context.toLowerCase()).toContain('minecraft version');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('plugin generation includes plugin API when specified', () => {
    fc.assert(
      fc.property(
        fc.record({
          minecraftVersion: fc.constantFrom('1.19', '1.20', '1.21'),
          pluginAPI: fc.constantFrom('spigot', 'paper', 'bukkit')
        }) as fc.Arbitrary<GenerationConfig>,
        (config) => {
          const context = PromptContextBuilder.build('plugin', config);
          
          if (config.pluginAPI) {
            expect(context.toLowerCase()).toContain(config.pluginAPI.toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Resource Type Specific Tests', () => {
  test('plugin context includes plugin API and structure requirements', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20',
      pluginAPI: 'spigot'
    };
    const context = PromptContextBuilder.build('plugin', config);
    
    expect(context).toContain('spigot');
    expect(context.toLowerCase()).toContain('plugin.yml');
    expect(context.toLowerCase()).toContain('package');
  });

  test('skript context includes Skript version and syntax requirements', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20',
      skriptVersion: '2.8'
    };
    const context = PromptContextBuilder.build('skript', config);
    
    expect(context).toContain('2.8');
    expect(context.toLowerCase()).toContain('skript');
    expect(context.toLowerCase()).toContain('syntax');
  });

  test('config context includes YAML and structure requirements', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const context = PromptContextBuilder.build('config', config);
    
    expect(context.toLowerCase()).toContain('yaml');
    expect(context.toLowerCase()).toContain('configuration');
  });

  test('datapack context includes JSON and vanilla requirements', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const context = PromptContextBuilder.build('datapack', config);
    
    expect(context.toLowerCase()).toContain('json');
    expect(context.toLowerCase()).toContain('data pack');
  });

  test('commandblock context includes command syntax requirements', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const context = PromptContextBuilder.build('commandblock', config);
    
    expect(context.toLowerCase()).toContain('command');
    expect(context.toLowerCase()).toContain('syntax');
  });

  test('all contexts request comments', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const resourceTypes: ResourceType[] = ['plugin', 'config', 'skript', 'datapack', 'commandblock'];
    
    resourceTypes.forEach(type => {
      const context = PromptContextBuilder.build(type, config);
      expect(context.toLowerCase()).toContain('comment');
    });
  });

  test('all contexts request best practices', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const resourceTypes: ResourceType[] = ['plugin', 'config', 'skript', 'datapack', 'commandblock'];
    
    resourceTypes.forEach(type => {
      const context = PromptContextBuilder.build(type, config);
      expect(context.toLowerCase()).toContain('best practices');
    });
  });

  test('all contexts request proper formatting', () => {
    const config: GenerationConfig = {
      minecraftVersion: '1.20'
    };
    const resourceTypes: ResourceType[] = ['plugin', 'config', 'skript', 'datapack', 'commandblock'];
    
    resourceTypes.forEach(type => {
      const context = PromptContextBuilder.build(type, config);
      expect(context.toLowerCase()).toContain('format');
    });
  });
});
