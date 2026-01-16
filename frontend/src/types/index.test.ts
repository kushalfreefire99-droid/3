import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { RESOURCE_TYPES, ResourceType } from './index';

describe('Resource Type Metadata', () => {
  const allResourceTypes: ResourceType[] = ['plugin', 'config', 'skript', 'datapack', 'commandblock'];

  // Feature: minecraft-code-generator, Property 3: All resource types are selectable
  // Feature: minecraft-code-generator, Property 4: Resource type example prompts
  test('all resource types have complete metadata with example prompts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allResourceTypes),
        (resourceType) => {
          const metadata = RESOURCE_TYPES[resourceType];
          
          // Verify metadata exists
          expect(metadata).toBeDefined();
          
          // Verify all required fields are present
          expect(metadata.type).toBe(resourceType);
          expect(metadata.displayName).toBeTruthy();
          expect(metadata.description).toBeTruthy();
          expect(metadata.fileExtension).toBeTruthy();
          expect(metadata.language).toBeTruthy();
          expect(metadata.examplePrompts).toBeDefined();
          expect(metadata.defaultConfig).toBeDefined();
          
          // Verify at least one example prompt exists (Property 4)
          expect(metadata.examplePrompts.length).toBeGreaterThan(0);
          
          // Verify example prompts are non-empty strings
          metadata.examplePrompts.forEach(prompt => {
            expect(prompt).toBeTruthy();
            expect(typeof prompt).toBe('string');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all expected resource types are present in RESOURCE_TYPES', () => {
    allResourceTypes.forEach(type => {
      expect(RESOURCE_TYPES[type]).toBeDefined();
    });
    
    // Verify no extra types exist
    expect(Object.keys(RESOURCE_TYPES).length).toBe(allResourceTypes.length);
  });
});


describe('Type Definitions Unit Tests', () => {
  test('RESOURCE_TYPES contains all expected resource types', () => {
    expect(RESOURCE_TYPES.plugin).toBeDefined();
    expect(RESOURCE_TYPES.config).toBeDefined();
    expect(RESOURCE_TYPES.skript).toBeDefined();
    expect(RESOURCE_TYPES.datapack).toBeDefined();
    expect(RESOURCE_TYPES.commandblock).toBeDefined();
  });

  test('each resource type has required metadata fields', () => {
    Object.values(RESOURCE_TYPES).forEach(metadata => {
      expect(metadata.type).toBeTruthy();
      expect(metadata.displayName).toBeTruthy();
      expect(metadata.description).toBeTruthy();
      expect(metadata.fileExtension).toBeTruthy();
      expect(metadata.language).toBeTruthy();
      expect(Array.isArray(metadata.examplePrompts)).toBe(true);
      expect(typeof metadata.defaultConfig).toBe('object');
    });
  });

  test('plugin metadata has correct structure', () => {
    const plugin = RESOURCE_TYPES.plugin;
    expect(plugin.type).toBe('plugin');
    expect(plugin.fileExtension).toBe('.java');
    expect(plugin.language).toBe('java');
    expect(plugin.defaultConfig.pluginAPI).toBeDefined();
  });

  test('config metadata has correct structure', () => {
    const config = RESOURCE_TYPES.config;
    expect(config.type).toBe('config');
    expect(config.fileExtension).toBe('.yml');
    expect(config.language).toBe('yaml');
  });

  test('skript metadata has correct structure', () => {
    const skript = RESOURCE_TYPES.skript;
    expect(skript.type).toBe('skript');
    expect(skript.fileExtension).toBe('.sk');
    expect(skript.language).toBe('skript');
    expect(skript.defaultConfig.skriptVersion).toBeDefined();
  });

  test('datapack metadata has correct structure', () => {
    const datapack = RESOURCE_TYPES.datapack;
    expect(datapack.type).toBe('datapack');
    expect(datapack.fileExtension).toBe('.json');
    expect(datapack.language).toBe('json');
  });

  test('commandblock metadata has correct structure', () => {
    const commandblock = RESOURCE_TYPES.commandblock;
    expect(commandblock.type).toBe('commandblock');
    expect(commandblock.fileExtension).toBe('.mcfunction');
    expect(commandblock.language).toBe('mcfunction');
  });
});
