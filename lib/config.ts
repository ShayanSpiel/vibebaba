// lib/config.ts
import { z } from 'zod';

// Define environment schema with validation
const envSchema = z.object({
  // PocketBase
  POCKETBASE_URL: z.string().url().default('http://127.0.0.1:8090'),
  POCKETBASE_ADMIN_EMAIL: z.string().email().optional(),
  POCKETBASE_ADMIN_PASSWORD: z.string().min(8).optional(),

  // API
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().min(16).default('development-secret-key-change-in-prod'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MCP
  MCP_SERVER_URL: z.string().url().optional(),

  // Deployment
  DEPLOYMENT_SERVER_URL: z.string().url().default('http://localhost:3001'),

  // Limits
  MAX_FILE_SIZE: z.number().default(5_000_000), // 5MB
  MAX_PROJECT_FILES: z.number().default(100),
  MAX_MESSAGE_LENGTH: z.number().default(10_000),

  // Cache TTL (in seconds)
  CACHE_TTL_PROJECT: z.number().default(300), // 5 minutes
  CACHE_TTL_MEMORY: z.number().default(300),
  CACHE_TTL_FILES: z.number().default(60),
});

// Parse and validate environment
function loadConfig() {
  try {
    return envSchema.parse({
      // PocketBase
      POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
      POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
      POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,

      // API
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,

      // AI
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

      // OAuth
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

      // Other
      CRON_SECRET: process.env.CRON_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      MCP_SERVER_URL: process.env.MCP_SERVER_URL,
      DEPLOYMENT_SERVER_URL: process.env.DEPLOYMENT_SERVER_URL,

      // Limits (allow override via env)
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined,
      MAX_PROJECT_FILES: process.env.MAX_PROJECT_FILES
        ? parseInt(process.env.MAX_PROJECT_FILES)
        : undefined,
      MAX_MESSAGE_LENGTH: process.env.MAX_MESSAGE_LENGTH
        ? parseInt(process.env.MAX_MESSAGE_LENGTH)
        : undefined,

      // Cache
      CACHE_TTL_PROJECT: process.env.CACHE_TTL_PROJECT
        ? parseInt(process.env.CACHE_TTL_PROJECT)
        : undefined,
      CACHE_TTL_MEMORY: process.env.CACHE_TTL_MEMORY
        ? parseInt(process.env.CACHE_TTL_MEMORY)
        : undefined,
      CACHE_TTL_FILES: process.env.CACHE_TTL_FILES
        ? parseInt(process.env.CACHE_TTL_FILES)
        : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      (error as any).errors.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration. Check your .env file.');
    }
    throw error;
  }
}

// Export validated config
export const config = loadConfig();

// Export types
export type Config = z.infer<typeof envSchema>;

// Helper: Check if in production
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';

// PocketBase collection names (type-safe)
export const Collections = {
  USERS: 'users',
  PROJECTS: 'projects',
  PROJECT_FILES: 'project_files',
  CONVERSATION_MEMORY: 'conversation_memory',
  PROJECT_SETTINGS_MEMORY: 'project_settings_memory',
  UPLOADED_FILES: 'uploaded_files',
  WORKFLOW_CHECKPOINTS: 'workflow_checkpoints',
  WORKFLOW_LOGS: 'workflow_logs',
  VALIDATION_ERRORS: 'validation_errors',
  PAYMENTS: 'payments',
  SEARCH_USAGE: 'search_usage',
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];

// Validation helpers
export function validateFileSize(size: number): boolean {
  return size <= config.MAX_FILE_SIZE;
}

export function validateProjectFileCount(count: number): boolean {
  return count <= config.MAX_PROJECT_FILES;
}

export function validateMessageLength(length: number): boolean {
  return length <= config.MAX_MESSAGE_LENGTH;
}
