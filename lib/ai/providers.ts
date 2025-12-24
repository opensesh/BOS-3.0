import { anthropic } from '@ai-sdk/anthropic';
import { perplexity } from '@ai-sdk/perplexity';
import Anthropic from '@anthropic-ai/sdk';

// ============================================
// MODEL CONFIGURATION
// ============================================

export type ModelId = 'auto' | 'claude-sonnet' | 'claude-opus' | 'claude-haiku' | 'sonar' | 'sonar-pro';

export interface ModelConfig {
  id: ModelId;
  name: string;
  version?: string;
  description: string;
  provider: 'anthropic' | 'perplexity' | 'auto';
  tier: 'fast' | 'balanced' | 'capable' | 'search' | 'smart';
  supportsThinking?: boolean;
  supportsTools?: boolean;
  maxOutputTokens?: number;
  contextWindow?: number;
}

export const models: Record<ModelId, ModelConfig> = {
  auto: {
    id: 'auto',
    name: 'Auto',
    description: 'Automatically selects the best model',
    provider: 'auto',
    tier: 'smart',
    supportsThinking: true,
    supportsTools: true,
  },
  'claude-opus': {
    id: 'claude-opus',
    name: 'Opus',
    version: '4',
    description: 'Most capable for complex tasks',
    provider: 'anthropic',
    tier: 'capable',
    supportsThinking: true,
    supportsTools: true,
    maxOutputTokens: 32000,
    contextWindow: 200000,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Sonnet',
    version: '4',
    description: 'Smartest for everyday tasks',
    provider: 'anthropic',
    tier: 'balanced',
    supportsThinking: true,
    supportsTools: true,
    maxOutputTokens: 16000,
    contextWindow: 200000,
  },
  'claude-haiku': {
    id: 'claude-haiku',
    name: 'Haiku',
    version: '3.5',
    description: 'Fastest for quick answers',
    provider: 'anthropic',
    tier: 'fast',
    supportsThinking: false, // Haiku doesn't support extended thinking
    supportsTools: true,
    maxOutputTokens: 8192,
    contextWindow: 200000,
  },
  sonar: {
    id: 'sonar',
    name: 'Sonar',
    description: 'Web search for current info',
    provider: 'perplexity',
    tier: 'search',
    supportsThinking: false,
    supportsTools: false,
  },
  'sonar-pro': {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    description: 'Advanced search with more sources',
    provider: 'perplexity',
    tier: 'capable',
    supportsThinking: false,
    supportsTools: false,
  },
};

// Anthropic model IDs for native SDK
export const ANTHROPIC_MODEL_IDS: Record<string, string> = {
  'claude-opus': 'claude-opus-4-20250514',
  'claude-sonnet': 'claude-sonnet-4-20250514',
  'claude-haiku': 'claude-3-5-haiku-20241022',
};

// ============================================
// VERCEL AI SDK PROVIDERS (Basic streaming)
// ============================================

export function getModelInstance(modelId: ModelId) {
  switch (modelId) {
    case 'claude-opus':
      return anthropic('claude-opus-4-20250514');
    case 'claude-sonnet':
      return anthropic('claude-sonnet-4-20250514');
    case 'claude-haiku':
      return anthropic('claude-3-5-haiku-20241022');
    case 'sonar':
      return perplexity('sonar');
    case 'sonar-pro':
      return perplexity('sonar-pro');
    default:
      // Default to Claude Sonnet for 'auto' or unknown models
      return anthropic('claude-sonnet-4-20250514');
  }
}

// ============================================
// NATIVE ANTHROPIC SDK CLIENT
// For extended thinking, tool use, and advanced features
// ============================================

let anthropicClient: Anthropic | null = null;

/**
 * Get the native Anthropic SDK client
 * Use this for extended thinking, tool use, and other advanced features
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  return anthropicClient;
}

/**
 * Get the native Anthropic model ID for a given ModelId
 */
export function getAnthropicModelId(modelId: ModelId): string {
  return ANTHROPIC_MODEL_IDS[modelId] || ANTHROPIC_MODEL_IDS['claude-sonnet'];
}

/**
 * Check if a model supports extended thinking
 */
export function supportsExtendedThinking(modelId: ModelId): boolean {
  return models[modelId]?.supportsThinking ?? false;
}

/**
 * Check if a model supports tool use
 */
export function supportsToolUse(modelId: ModelId): boolean {
  return models[modelId]?.supportsTools ?? false;
}

/**
 * Check if a model is from Anthropic
 */
export function isAnthropicModel(modelId: ModelId): boolean {
  return models[modelId]?.provider === 'anthropic' || modelId === 'auto';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get all available model options for the selector
export function getModelOptions(): ModelConfig[] {
  return Object.values(models);
}

// Get models that support a specific feature
export function getModelsWithFeature(feature: 'thinking' | 'tools'): ModelConfig[] {
  return Object.values(models).filter((m) => {
    if (feature === 'thinking') return m.supportsThinking;
    if (feature === 'tools') return m.supportsTools;
    return false;
  });
}

// Default thinking budget for extended thinking (tokens)
export const DEFAULT_THINKING_BUDGET = 10000;
export const MAX_THINKING_BUDGET = 100000;
