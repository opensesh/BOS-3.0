/**
 * Chat System Constants
 *
 * Centralized configuration for timeouts, limits, and retry behavior.
 * These values can be tuned based on production experience.
 */

/**
 * Timeout configurations in milliseconds
 */
export const CHAT_TIMEOUTS = {
  /** Overall request timeout for API calls (2 minutes - extended for thinking) */
  REQUEST_TIMEOUT: 120_000,

  /** How long to wait for stream data before considering it stalled (45 seconds) */
  STREAM_STALL_TIMEOUT: 45_000,

  /** Timeout for individual tool execution (30 seconds) */
  TOOL_EXECUTION_TIMEOUT: 30_000,

  /** Timeout for continuation requests after tool use (60 seconds) */
  CONTINUATION_TIMEOUT: 60_000,

  /** How often to check for stream stalls (5 seconds) */
  STALL_CHECK_INTERVAL: 5_000,

  /** Minimum stream duration before checking for stalls (10 seconds) */
  MIN_STREAM_DURATION_FOR_STALL_CHECK: 10_000,
} as const;

/**
 * Input and processing limits
 */
export const CHAT_LIMITS = {
  /** Maximum characters in a single message (~100KB text) */
  MAX_MESSAGE_LENGTH: 100_000,

  /** Maximum total size of all attachments in bytes (10MB) */
  MAX_ATTACHMENT_SIZE: 10_485_760,

  /** Maximum number of file attachments per message */
  MAX_ATTACHMENTS: 10,

  /** Maximum rounds of tool use in a single request */
  MAX_TOOL_ROUNDS: 5,

  /** Maximum retries for transient failures */
  MAX_RETRIES: 3,

  /** Maximum sources to collect during a request */
  MAX_COLLECTED_SOURCES: 50,

  /** Maximum conversation messages during tool use (to prevent OOM) */
  MAX_TOOL_CONVERSATION_MESSAGES: 30,

  /** Maximum accumulated content length for processing (100KB) */
  MAX_CONTENT_LENGTH: 100_000,
} as const;

/**
 * Retry configuration for exponential backoff
 */
export const RETRY_CONFIG = {
  /** Initial delay between retries (1 second) */
  BASE_DELAY: 1_000,

  /** Maximum delay between retries (30 seconds) */
  MAX_DELAY: 30_000,

  /** Randomization factor for jitter (±20%) */
  JITTER_FACTOR: 0.2,
} as const;

/**
 * Streaming chunk delays for smooth UX
 */
export const STREAM_DELAYS = {
  /** Delay between streaming individual sources (30ms) */
  SOURCE_STREAM_DELAY: 30,

  /** Delay between streaming Perplexity sources (40ms) */
  PERPLEXITY_SOURCE_DELAY: 40,

  /** Delay between canvas content chunks (10ms) */
  CANVAS_CHUNK_DELAY: 10,

  /** Characters per chunk for canvas streaming */
  CANVAS_CHARS_PER_CHUNK: 100,
} as const;

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Timeouts
  TIMEOUT: 'TIMEOUT',
  STREAM_STALL: 'STREAM_STALL',
  CONTINUATION_TIMEOUT: 'CONTINUATION_TIMEOUT',

  // Input validation
  INPUT_TOO_LARGE: 'INPUT_TOO_LARGE',
  TOO_MANY_ATTACHMENTS: 'TOO_MANY_ATTACHMENTS',
  INVALID_INPUT: 'INVALID_INPUT',

  // Tool errors
  TOOL_EXECUTION: 'TOOL_EXECUTION',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  MAX_TOOLS_EXCEEDED: 'MAX_TOOLS_EXCEEDED',

  // Auth errors
  API_AUTH: 'API_AUTH',
  INVALID_API_KEY: 'INVALID_API_KEY',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Generic
  UNKNOWN: 'UNKNOWN',
  ABORTED: 'ABORTED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * HTTP status codes for common scenarios
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
