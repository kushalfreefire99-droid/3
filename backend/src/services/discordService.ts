import { storage } from '../storage/fileStorage.js';

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}

/**
 * Discord webhook service for posting resources
 */
export class DiscordService {
  private webhooks = {
    plugin: 'https://discord.com/api/webhooks/1461698320207577171/ZfZN0z3QrGgEAvCil7JYu_LnM_m3kOo-_x-gOj3uG6TR8ncZRYXTJCJQ2nVLBjwMR_P0', // Forum webhook
    skript: 'https://discord.com/api/webhooks/1461694935043408076/VXTHjaT-U0vDM-GR_6_mL3hOgVUUGjxrSgv3NuvVun-YbQ4EwXsTNnE0umRozBb0pwF7', // Forum webhook
    config: 'https://discord.com/api/webhooks/1461698233360449638/Uw6it8sPDi47YzIbDEI_xCjgKSJ35f0NrTEPGuQrxsPkJp1dxqpYSoDbPcrZ6QHlnIkj' // Forum webhook
  };

  /**
   * Post resource to Discord
   */
  async postResource(resource: {
    id: string;
    type: 'plugin' | 'skript' | 'config';
    name: string;
    code: string;
    filename: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Check if public sharing is enabled
      if (!storage.config.publicSharingEnabled) {
        console.log('[DISCORD] Public sharing is disabled, skipping webhook');
        return;
      }

      const webhookUrl = this.webhooks[resource.type];
      
      if (!webhookUrl) {
        console.log('[DISCORD] No webhook configured for type:', resource.type);
        return;
      }

      // All resources now use forum post format
      await this.postToForum(resource, webhookUrl);
    } catch (error) {
      console.error('[DISCORD] Error posting to webhook:', error);
    }
  }

  /**
   * Post resource to forum channel with code included
   */
  private async postToForum(resource: any, webhookUrl: string): Promise<void> {
    // Truncate code if too long (Discord has 2000 char limit per message)
    const maxCodeLength = 1800;
    let codeBlock = resource.code;
    let truncated = false;
    
    if (codeBlock.length > maxCodeLength) {
      codeBlock = codeBlock.substring(0, maxCodeLength);
      truncated = true;
    }

    // Determine language for syntax highlighting
    const languageMap: Record<string, string> = {
      plugin: 'java',
      skript: 'skript',
      config: 'yaml'
    };
    const language = languageMap[resource.type] || 'text';

    // Determine emoji for resource type
    const emojiMap: Record<string, string> = {
      plugin: '🔌',
      skript: '📜',
      config: '⚙️'
    };
    const emoji = emojiMap[resource.type] || '📦';

    // Format resource name: capitalize first letter of each word
    const formatName = (name: string) => {
      return name
        .split(/[\s_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Format resource type: capitalize first letter
    const formatType = (type: string) => {
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const formattedName = formatName(resource.name);
    const formattedType = formatType(resource.type);

    const content = `${emoji} **New ${formattedType}: ${formattedName}**

**Filename:** \`${resource.filename}\`
**Lines of Code:** ${resource.code.split('\n').length}
${resource.metadata?.description ? `**Description:** ${resource.metadata.description}` : ''}
${resource.type === 'plugin' ? '\n📦 **Build JAR:** Visit CodersLab to compile this plugin into a JAR file!\n' : ''}
**Code:**
\`\`\`${language}
${codeBlock}${truncated ? '\n... (truncated)' : ''}
\`\`\`

${truncated ? '⚠️ Code was truncated due to length. Full code available on website.' : ''}

*Made from CodersLab*`;

    const payload = {
      content,
      thread_name: `${formattedName} ${formattedType}`,
    };

    const response = await fetch(webhookUrl + '?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DISCORD] Forum webhook failed:', response.status, errorText);
    } else {
      console.log('[DISCORD] Successfully posted', resource.type, 'to forum:', resource.name);
    }
  }

}

// Export singleton instance
export const discordService = new DiscordService();
