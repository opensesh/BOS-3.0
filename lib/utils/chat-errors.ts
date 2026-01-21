/**
 * Chat Error Classes
 *
 * Typed error classes for better error handling and user feedback
 * in the chat system. Each error type includes metadata for appropriate
 * handling (retryable, status codes, etc.).
 */

/**
 * Base chat error class with common properties
 */
export class ChatError extends Error {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Whether this error is potentially retryable */
  readonly retryable: boolean;
  /** HTTP status code if applicable */
  readonly statusCode?: number;
  /** Timestamp when the error occurred */
  readonly timestamp: Date;
  /** Original error that caused this error */
  readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    options: {
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.timestamp = new Date();
    this.cause = options.cause;

    // Maintains proper stack trace for where our error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a user-friendly error message
   */
  get userMessage(): string {
    return this.message;
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Rate limit error (429)
 * Indicates the API is being called too frequently
 */
export class RateLimitError extends ChatError {
  /** Seconds to wait before retrying (from Retry-After header) */
  readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded. Please wait before trying again.',
    code: string = 'RATE_LIMITED',
    retryAfter?: number
  ) {
    super(message, code, { retryable: true, statusCode: 429 });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  get userMessage(): string {
    if (this.retryAfter) {
      return `Rate limited. Please wait ${this.retryAfter} seconds before trying again.`;
    }
    return 'Too many requests. Please wait a moment before trying again.';
  }
}

/**
 * Timeout error
 * Request or operation exceeded time limit
 */
export class TimeoutError extends ChatError {
  /** How long we waited before timing out (ms) */
  readonly timeoutMs: number;

  constructor(
    message: string = 'Request timed out. Please try again.',
    code: string = 'TIMEOUT',
    timeoutMs: number = 0
  ) {
    super(message, code, { retryable: true, statusCode: 408 });
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }

  get userMessage(): string {
    return 'The request took too long to complete. Please try again.';
  }
}

/**
 * Stream stall error
 * Streaming response stopped receiving data
 */
export class StreamStallError extends ChatError {
  /** How long the stream was stalled (ms) */
  readonly stallDurationMs: number;
  /** Whether text was received before stalling */
  readonly hadReceivedText: boolean;
  /** Whether sources were received before stalling */
  readonly hadReceivedSources: boolean;

  constructor(
    message: string = 'Response generation stalled. Please try again.',
    code: string = 'STREAM_STALL',
    options: {
      stallDurationMs?: number;
      hadReceivedText?: boolean;
      hadReceivedSources?: boolean;
    } = {}
  ) {
    super(message, code, { retryable: true });
    this.name = 'StreamStallError';
    this.stallDurationMs = options.stallDurationMs ?? 0;
    this.hadReceivedText = options.hadReceivedText ?? false;
    this.hadReceivedSources = options.hadReceivedSources ?? false;
  }

  get userMessage(): string {
    if (this.hadReceivedSources && !this.hadReceivedText) {
      return 'Found some information but had trouble generating a response. Please try again.';
    }
    return 'Response generation stalled. Please try again.';
  }
}

/**
 * Input validation error
 * User input failed validation (too long, invalid format, etc.)
 */
export class InputValidationError extends ChatError {
  /** Field that failed validation */
  readonly field?: string;
  /** Maximum allowed value (for size limits) */
  readonly maxValue?: number;
  /** Actual value that was provided */
  readonly actualValue?: number;

  constructor(
    message: string,
    code: string = 'INPUT_VALIDATION',
    options: {
      field?: string;
      maxValue?: number;
      actualValue?: number;
    } = {}
  ) {
    super(message, code, { retryable: false, statusCode: 400 });
    this.name = 'InputValidationError';
    this.field = options.field;
    this.maxValue = options.maxValue;
    this.actualValue = options.actualValue;
  }

  get userMessage(): string {
    if (this.code === 'INPUT_TOO_LARGE') {
      return 'Your message is too long. Please shorten it and try again.';
    }
    if (this.code === 'TOO_MANY_ATTACHMENTS') {
      return `Too many attachments. Maximum allowed is ${this.maxValue}.`;
    }
    return this.message;
  }
}

/**
 * Tool execution error
 * A tool (web search, calculator, etc.) failed to execute
 */
export class ToolExecutionError extends ChatError {
  /** Name of the tool that failed */
  readonly toolName: string;
  /** Input that was passed to the tool */
  readonly toolInput?: Record<string, unknown>;

  constructor(
    message: string,
    toolName: string,
    code: string = 'TOOL_EXECUTION',
    options: {
      toolInput?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, code, {
      retryable: options.retryable ?? true,
      cause: options.cause
    });
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
    this.toolInput = options.toolInput;
  }

  get userMessage(): string {
    return `The ${this.toolName} tool encountered an issue. The response may be incomplete.`;
  }
}

/**
 * API authentication error
 * API key is missing, invalid, or lacks permissions
 */
export class APIAuthError extends ChatError {
  /** Which API/provider had the auth issue */
  readonly provider?: string;

  constructor(
    message: string = 'API authentication failed.',
    code: string = 'API_AUTH',
    provider?: string
  ) {
    super(message, code, { retryable: false, statusCode: 401 });
    this.name = 'APIAuthError';
    this.provider = provider;
  }

  get userMessage(): string {
    return 'There was an authentication issue with the AI service. Please try again later.';
  }
}

/**
 * Network error
 * Network connectivity issues
 */
export class NetworkError extends ChatError {
  constructor(
    message: string = 'Network error. Please check your connection.',
    code: string = 'NETWORK_ERROR',
    cause?: Error
  ) {
    super(message, code, { retryable: true, cause });
    this.name = 'NetworkError';
  }

  get userMessage(): string {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
}

/**
 * Server error (5xx)
 * API server-side error
 */
export class ServerError extends ChatError {
  constructor(
    message: string = 'Server error. Please try again.',
    code: string = 'SERVER_ERROR',
    statusCode: number = 500
  ) {
    super(message, code, { retryable: true, statusCode });
    this.name = 'ServerError';
  }

  get userMessage(): string {
    return 'The AI service is experiencing issues. Please try again in a moment.';
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert an unknown error to a typed ChatError
 */
export function toChatError(error: unknown): ChatError {
  if (error instanceof ChatError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit detection
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return new RateLimitError(error.message, 'RATE_LIMITED');
    }

    // Auth error detection
    if (message.includes('401') || message.includes('403') ||
        message.includes('unauthorized') || message.includes('api key') ||
        message.includes('authentication')) {
      return new APIAuthError(error.message, 'API_AUTH');
    }

    // Network error detection
    if (message.includes('network') || message.includes('fetch failed') ||
        message.includes('econnrefused') || message.includes('econnreset') ||
        error.name === 'TypeError' && message.includes('failed to fetch')) {
      return new NetworkError(error.message, 'NETWORK_ERROR', error);
    }

    // Server error detection
    if (message.includes('500') || message.includes('502') ||
        message.includes('503') || message.includes('504') ||
        message.includes('internal server error') || message.includes('bad gateway')) {
      const statusMatch = message.match(/\b(50[0-4])\b/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 500;
      return new ServerError(error.message, 'SERVER_ERROR', statusCode);
    }

    // Timeout detection
    if (message.includes('timeout') || message.includes('timed out') ||
        error.name === 'AbortError') {
      return new TimeoutError(error.message, 'TIMEOUT');
    }

    // Generic chat error
    return new ChatError(error.message, 'UNKNOWN', { cause: error });
  }

  // Unknown error type
  return new ChatError(String(error), 'UNKNOWN');
}

/**
 * Check if an error is a specific type
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isStreamStallError(error: unknown): error is StreamStallError {
  return error instanceof StreamStallError;
}

export function isInputValidationError(error: unknown): error is InputValidationError {
  return error instanceof InputValidationError;
}

export function isToolExecutionError(error: unknown): error is ToolExecutionError {
  return error instanceof ToolExecutionError;
}

export function isAPIAuthError(error: unknown): error is APIAuthError {
  return error instanceof APIAuthError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof ChatError) {
    return error.retryable;
  }
  return false;
}
