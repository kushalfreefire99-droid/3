/**
 * Enhances user prompts to be more detailed and specific for better AI generation
 */
export class PromptEnhancer {
  /**
   * Enhances a user prompt by adding context and clarity
   * @param userPrompt - The original user prompt
   * @param resourceType - The type of resource being generated
   * @returns Enhanced prompt with better structure and detail
   */
  static enhance(userPrompt: string, resourceType: string): string {
    const cleanPrompt = userPrompt.trim();
    
    // Check if Minecraft-related
    const minecraftKeywords = [
      'minecraft', 'plugin', 'bukkit', 'spigot', 'paper', 'skript',
      'datapack', 'command', 'block', 'player', 'server', 'world',
      'entity', 'item', 'mob', 'config', 'yml', 'yaml'
    ];
    
    const lowerPrompt = cleanPrompt.toLowerCase();
    const isMinecraftRelated = minecraftKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    let enhanced = isMinecraftRelated ? cleanPrompt : `For Minecraft: ${cleanPrompt}`;
    enhanced = `Create an ADVANCED, PROFESSIONAL Minecraft ${resourceType}: ${enhanced}`;
    
    // Enhanced requirements for advanced, feature-rich generation
    if (resourceType === 'plugin') {
      enhanced += `. 

REQUIREMENTS FOR ADVANCED PLUGIN:
1. Use modern Bukkit/Spigot API (org.bukkit.*) with latest features
2. Implement MULTIPLE classes with proper separation of concerns (Main class, Commands, Listeners, Managers, Utils)
3. Add configuration file support (config.yml) with customizable options
4. Include data persistence (YAML, JSON, or SQLite database)
5. Add permission nodes for different features
6. Implement tab completion for commands
7. Add detailed logging and error handling
8. Include reload command functionality
9. Use modern Java features (streams, lambdas, optional)
10. Add PlaceholderAPI support if relevant
11. Include economy integration (Vault) if applicable
12. Add comprehensive comments and JavaDoc
13. Implement proper event handling with priority
14. Add cooldowns, limits, or restrictions where appropriate
15. Include admin commands and player commands
16. Make it production-ready with proper validation and security

STRUCTURE: Create multiple files/classes organized professionally.`;
    } else {
      enhanced += `. Make it ADVANCED, feature-rich, well-structured, and production-ready with extensive functionality.`;
    }
    
    return enhanced;
  }
  
  /**
   * Enhances a modification prompt to ensure clean and formal modifications
   * @param modificationPrompt - The user's modification request
   * @returns Enhanced modification prompt with formal style requirements
   */
  static enhanceModification(modificationPrompt: string): string {
    const cleanPrompt = modificationPrompt.trim();
    
    return `Modify the code to ${cleanPrompt}. Ensure it compiles: use correct imports (org.bukkit.*), fix method names, keep it simple and functional.`;
  }
}
