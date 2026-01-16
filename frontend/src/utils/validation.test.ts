import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { validatePrompt } from './validation';

describe('Prompt Validation', () => {
  // Feature: minecraft-code-generator, Property 1: Prompt length validation
  test('accepts prompts between 10 and 5000 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 5000 }),
        (prompt) => {
          const result = validatePrompt(prompt);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rejects prompts shorter than 10 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 9 }),
        (prompt) => {
          const result = validatePrompt(prompt);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rejects prompts longer than 5000 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5001, maxLength: 6000 }),
        (prompt) => {
          const result = validatePrompt(prompt);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Whitespace Prompt Rejection', () => {
  // Feature: minecraft-code-generator, Property 2: Whitespace-only prompt rejection
  test('rejects whitespace-only prompts', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }),
        (whitespacePrompt) => {
          const result = validatePrompt(whitespacePrompt);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('empty');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rejects empty string', () => {
    const result = validatePrompt('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});


describe('Edge Cases', () => {
  test('accepts exactly 10 characters (boundary)', () => {
    const prompt = '1234567890';
    const result = validatePrompt(prompt);
    expect(result.valid).toBe(true);
  });

  test('accepts exactly 5000 characters (boundary)', () => {
    const prompt = 'a'.repeat(5000);
    const result = validatePrompt(prompt);
    expect(result.valid).toBe(true);
  });

  test('rejects exactly 9 characters (boundary)', () => {
    const prompt = '123456789';
    const result = validatePrompt(prompt);
    expect(result.valid).toBe(false);
  });

  test('rejects exactly 5001 characters (boundary)', () => {
    const prompt = 'a'.repeat(5001);
    const result = validatePrompt(prompt);
    expect(result.valid).toBe(false);
  });

  test('rejects empty string', () => {
    const result = validatePrompt('');
    expect(result.valid).toBe(false);
  });

  test('rejects string with only spaces', () => {
    const result = validatePrompt('          ');
    expect(result.valid).toBe(false);
  });

  test('rejects string with only tabs', () => {
    const result = validatePrompt('\t\t\t\t');
    expect(result.valid).toBe(false);
  });

  test('rejects string with only newlines', () => {
    const result = validatePrompt('\n\n\n');
    expect(result.valid).toBe(false);
  });

  test('rejects string with mixed whitespace', () => {
    const result = validatePrompt('  \t\n  \r  ');
    expect(result.valid).toBe(false);
  });
});
