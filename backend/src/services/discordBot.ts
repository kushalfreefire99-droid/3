import { Client, GatewayIntentBits, AttachmentBuilder, TextChannel, ForumChannel } from 'discord.js';
import { storage } from '../storage/fileStorage.js';

/**
 * Discord Bot Service
 * Handles posting resources with file attachments and user authentication
 */
export class DiscordBot {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
    });

    this.setupEventHandlers();
  }

  /**
   * Get channel IDs (lazy loaded from environment)
   */
  private getChannels() {
    return {
      plugin: process.env.DISCORD_PLUGIN_CHANNEL_ID || '',
      skript: process.env.DISCORD_SKRIPT_CHANNEL_ID || '',
      config: process.env.DISCORD_CONFIG_CHANNEL_ID || ''
    };
  }

  /**
   * Setup Discord bot event handlers
   */
  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      console.log(`[DISCORD BOT] Logged in as ${this.client.user?.tag}`);
      this.isReady = true;
    });

    this.client.on('error', (error) => {
      console.error('[DISCORD BOT] Error:', error);
    });
  }

  /**
   * Start the Discord bot
   */
  async start(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    
    if (!token) {
      console.warn('[DISCORD BOT] No bot token provided, bot will not start');
      return;
    }

    try {
      await this.client.login(token);
      
      // Log channel configuration after login
      const channels = this.getChannels();
      console.log('[DISCORD BOT] Channel configuration:', {
        plugin: channels.plugin || 'NOT SET',
        skript: channels.skript || 'NOT SET',
        config: channels.config || 'NOT SET'
      });
    } catch (error) {
      console.error('[DISCORD BOT] Failed to login:', error);
    }
  }

  /**
   * Stop the Discord bot
   */
  async stop(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('[DISCORD BOT] Bot stopped');
    }
  }

  /**
   * Post resource to Discord with optional file attachment
   */
  async postResource(resource: {
    id: string;
    type: 'plugin' | 'skript' | 'config';
    name: string;
    code: string;
    filename: string;
    metadata?: any;
  }, jarBuffer?: Buffer): Promise<void> {
    if (!this.isReady) {
      console.log('[DISCORD BOT] Bot not ready, skipping post');
      return;
    }

    if (!storage.config.publicSharingEnabled) {
      console.log('[DISCORD BOT] Public sharing disabled, skipping post');
      return;
    }

    try {
      const channels = this.getChannels();
      const channelId = channels[resource.type];
      
      if (!channelId) {
        console.log('[DISCORD BOT] No channel configured for type:', resource.type);
        console.log('[DISCORD BOT] Available channels:', channels);
        return;
      }

      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        console.error('[DISCORD BOT] Channel not found:', channelId);
        return;
      }

      // Check if it's a forum channel
      if (channel.isThreadOnly()) {
        await this.postToForum(channel as ForumChannel, resource, jarBuffer);
      } else if (channel.isTextBased()) {
        await this.postToTextChannel(channel as TextChannel, resource, jarBuffer);
      }
    } catch (error) {
      console.error('[DISCORD BOT] Error posting resource:', error);
    }
  }

  /**
   * Post to forum channel with thread
   */
  private async postToForum(
    channel: ForumChannel,
    resource: any,
    jarBuffer?: Buffer
  ): Promise<void> {
    const { name, type, code, filename } = resource;
    
    // Format name and type
    const formattedName = this.formatName(name);
    const formattedType = this.formatType(type);
    
    // Create message content
    const content = this.createMessageContent(resource);
    
    // Prepare attachments
    const files: AttachmentBuilder[] = [];
    
    // Add code file
    const codeBuffer = Buffer.from(code, 'utf-8');
    files.push(new AttachmentBuilder(codeBuffer, { name: filename }));
    
    // Add JAR file if provided (for plugins)
    if (jarBuffer && type === 'plugin') {
      const jarFilename = `coderslab_${name.toLowerCase().replace(/\s+/g, '_')}.jar`;
      files.push(new AttachmentBuilder(jarBuffer, { name: jarFilename }));
    }
    
    // Create thread in forum
    const thread = await channel.threads.create({
      name: `${formattedName} ${formattedType}`,
      message: {
        content,
        files
      }
    });
    
    console.log('[DISCORD BOT] Posted to forum:', thread.name);
  }

  /**
   * Post to regular text channel
   */
  private async postToTextChannel(
    channel: TextChannel,
    resource: any,
    jarBuffer?: Buffer
  ): Promise<void> {
    const { name, type, code, filename } = resource;
    
    // Create message content
    const content = this.createMessageContent(resource);
    
    // Prepare attachments
    const files: AttachmentBuilder[] = [];
    
    // Add code file
    const codeBuffer = Buffer.from(code, 'utf-8');
    files.push(new AttachmentBuilder(codeBuffer, { name: filename }));
    
    // Add JAR file if provided (for plugins)
    if (jarBuffer && type === 'plugin') {
      const jarFilename = `coderslab_${name.toLowerCase().replace(/\s+/g, '_')}.jar`;
      files.push(new AttachmentBuilder(jarBuffer, { name: jarFilename }));
    }
    
    // Send message
    await channel.send({
      content,
      files
    });
    
    console.log('[DISCORD BOT] Posted to channel:', channel.name);
  }

  /**
   * Create message content
   */
  private createMessageContent(resource: any): string {
    const { name, type, code, filename, metadata } = resource;
    
    const emojiMap: Record<string, string> = {
      plugin: '⚡',
      skript: '◆',
      config: '⚙'
    };
    const emoji = emojiMap[type] || '📦';
    
    const formattedName = this.formatName(name);
    const formattedType = this.formatType(type);
    
    let content = `${emoji} **New ${formattedType}: ${formattedName}**\n\n`;
    content += `**Filename:** \`${filename}\`\n`;
    content += `**Lines of Code:** ${code.split('\n').length}\n`;
    
    if (metadata?.description) {
      content += `**Description:** ${metadata.description}\n`;
    }
    
    if (type === 'plugin') {
      content += `\n📦 **JAR File:** Attached below (if built)\n`;
    }
    
    content += `\n*Made from CodersLab*`;
    
    return content;
  }

  /**
   * Format name: capitalize first letter of each word
   */
  private formatName(name: string): string {
    return name
      .split(/[\s_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format type: capitalize first letter
   */
  private formatType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Check if bot is ready
   */
  isConnected(): boolean {
    return this.isReady;
  }

  /**
   * Add a user to the guild using OAuth2 access token
   */
  async addMemberToGuild(userId: string, accessToken: string): Promise<void> {
    const guildId = process.env.DISCORD_GUILD_ID;
    
    if (!guildId) {
      console.warn('[DISCORD BOT] No guild ID configured');
      return;
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      await guild.members.add(userId, {
        accessToken
      });
      console.log('[DISCORD BOT] Added user to guild:', userId);
    } catch (error) {
      console.error('[DISCORD BOT] Error adding member to guild:', error);
      throw error;
    }
  }

  /**
   * Check if user is a member of the guild
   */
  async isGuildMember(userId: string): Promise<boolean> {
    const guildId = process.env.DISCORD_GUILD_ID;
    
    if (!guildId) {
      console.warn('[DISCORD BOT] No guild ID configured');
      return false;
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId).catch(() => null);
      return member !== null;
    } catch (error) {
      console.error('[DISCORD BOT] Error checking guild membership:', error);
      return false;
    }
  }

  /**
   * Send verification DM to user
   */
  async sendVerificationDM(userId: string, verificationCode: string): Promise<void> {
    try {
      const user = await this.client.users.fetch(userId);
      await user.send(
        `Welcome to CodersLab! 🎮\n\n` +
        `Your verification code is: \`${verificationCode}\`\n\n` +
        `Please use the \`/verify ${verificationCode}\` command in our server to complete your verification.\n\n` +
        `Join our Discord: https://discord.gg/FYv6kDJg3Y`
      );
      console.log('[DISCORD BOT] Sent verification DM to:', userId);
    } catch (error) {
      console.error('[DISCORD BOT] Error sending verification DM:', error);
    }
  }
}

// Export singleton instance
export const discordBot = new DiscordBot();
