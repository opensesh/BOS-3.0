// Note: SDKs are imported dynamically to avoid issues during static generation
// These types help with TypeScript inference
type AnthropicClient = InstanceType<typeof import('@anthropic-ai/sdk').default>;
type PerplexityClientClass = Awaited<ReturnType<typeof import('@perplexity-ai/perplexity_ai')>>['Perplexity'];

// ============================================
// MODEL CONFIGURATION
// ============================================

export type ModelId = 'auto' | 'claude-sonnet' | 'claude-opus' | 'sonar' | 'sonar-pro';

export interface ModelConfig {
  id: ModelId;
  name: string;
  version?: string;
  description: string;
  provider: 'anthropic' | 'perplexity' | 'auto';
  tier: 'balanced' | 'capable' | 'search' | 'smart';
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
};

// ============================================
// PERPLEXITY MODEL IDS
// ============================================

export const PERPLEXITY_MODEL_IDS: Record<string, string> = {
  'sonar': 'sonar',
  'sonar-pro': 'sonar-pro',
};

// ============================================
// NATIVE ANTHROPIC SDK CLIENT
// For extended thinking, tool use, and advanced features
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anthropicClient: any = null;

/**
 * Get the native Anthropic SDK client
 * Use this for extended thinking, tool use, and other advanced features
 * Note: Returns a promise because the SDK is dynamically imported
 */
export async function getAnthropicClient(): Promise<AnthropicClient> {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
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
// NATIVE PERPLEXITY SDK CLIENT
// For web-grounded AI responses
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let perplexityClient: any = null;

/**
 * Get the native Perplexity SDK client
 * Use this for Sonar models with web search capabilities
 * Note: Returns a promise because the SDK is dynamically imported
 */
export async function getPerplexityClient(): Promise<InstanceType<PerplexityClient>> {
  if (!perplexityClient) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }
    const { Perplexity } = await import('@perplexity-ai/perplexity_ai');
    perplexityClient = new Perplexity({
      apiKey,
    });
  }
  return perplexityClient;
}

/**
 * Get the Perplexity model ID for a given ModelId
 */
export function getPerplexityModelId(modelId: ModelId): string {
  return PERPLEXITY_MODEL_IDS[modelId] || PERPLEXITY_MODEL_IDS['sonar'];
}

/**
 * Check if a model is from Perplexity
 */
export function isPerplexityModel(modelId: ModelId): boolean {
  return models[modelId]?.provider === 'perplexity';
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
