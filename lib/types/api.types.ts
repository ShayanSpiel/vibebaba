// lib/types/api.types.ts
import { z } from 'zod';

// File change representation
export const FileChangeSchema = z.object({
  type: z.enum(['create', 'update', 'delete']),
  path: z.string(),
  content: z.string().optional(),
  oldContent: z.string().optional(),
});

export type FileChange = z.infer<typeof FileChangeSchema>;

// AI metadata
export const AIMetadataSchema = z.object({
  model: z.string(),
  tokens: z.number(),
  confidence: z.number().min(0).max(1).optional(),
  executionTime: z.number().optional(),
});

export type AIMetadata = z.infer<typeof AIMetadataSchema>;

// Validation result
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(
    z.object({
      file: z.string(),
      line: z.number().optional(),
      message: z.string(),
    })
  ),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// User input request
export const UserInputRequestSchema = z.object({
  type: z.enum(['confirmation', 'choice', 'text']),
  question: z.string(),
  options: z.array(z.string()).optional(),
});

export type UserInputRequest = z.infer<typeof UserInputRequestSchema>;

// UNIFIED AI response
export const AIResponseSchema = z.object({
  // Always present
  response: z.string(),
  stage: z.enum(['planning', 'building', 'completed', 'editing']),

  // Optional fields (depending on stage)
  updatedPlan: z.string().optional(),
  updatedFiles: z.array(z.any()).optional(),
  fileChanges: z.array(FileChangeSchema).optional(),
  changesApplied: z.array(z.string()).optional(),
  aiMetadata: AIMetadataSchema.optional(),
  validation: ValidationResultSchema.optional(),
  needsUserInput: z.boolean().optional(),
  userInputRequest: UserInputRequestSchema.optional(),
  lastCheckpointId: z.string().optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// API wrapper
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  metadata: z
    .object({
      timestamp: z.string(),
      requestId: z.string(),
      version: z.string(),
    })
    .optional(),
});

export type APIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};
