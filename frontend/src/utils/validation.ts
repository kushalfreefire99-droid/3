export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a user prompt for code generation
 * @param prompt - The user's input prompt
 * @returns ValidationResult indicating if the prompt is valid
 */
export function validatePrompt(prompt: string): ValidationResult {
  // Check if prompt is empty or only whitespace
  if (!prompt || prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty or contain only whitespace'
    };
  }

  // Check minimum length (10 characters)
  if (prompt.length < 10) {
    return {
      valid: false,
      error: 'Prompt must be at least 10 characters long'
    };
  }

  // Check maximum length (5000 characters)
  if (prompt.length > 5000) {
    return {
      valid: false,
      error: 'Prompt must not exceed 5000 characters'
    };
  }

  return { valid: true };
}
