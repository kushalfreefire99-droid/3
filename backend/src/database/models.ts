/**
 * Database model interfaces
 */

export interface User {
  id: string;
  discord_id?: string;
  ip_address: string;
  created_at: number;
  last_active: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  start_date: number;
  expiry_date: number;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  payment_id?: string;
  created_at: number;
  updated_at: number;
}

export interface Resource {
  id: string;
  type: 'plugin' | 'skript' | 'config';
  name: string;
  code: string;
  filename: string;
  user_id: string;
  is_public: number; // SQLite uses 0/1 for boolean
  view_count: number;
  shareable_link?: string;
  metadata?: string; // JSON string
  created_at: number;
}

export interface ResourceMetadata {
  pluginName?: string;
  version?: string;
  minecraftVersion?: string;
  apiType?: string;
  description?: string;
}

export interface Config {
  key: string;
  value: string; // JSON string
  updated_at: number;
}

export interface Statistics {
  id: string;
  date: string; // YYYY-MM-DD
  total_generations: number;
  total_builds: number;
  new_users: number;
  active_subscriptions: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: number;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  details?: string;
  created_at: number;
}

/**
 * Helper to convert Resource to public-facing format
 */
export interface PublicResource extends Omit<Resource, 'is_public' | 'metadata'> {
  isPublic: boolean;
  metadata?: ResourceMetadata;
}

/**
 * Helper to convert database resource to public format
 */
export function toPublicResource(resource: Resource): PublicResource {
  const { is_public, metadata, ...rest } = resource;
  return {
    ...rest,
    isPublic: is_public === 1,
    metadata: metadata ? JSON.parse(metadata) : undefined
  };
}
