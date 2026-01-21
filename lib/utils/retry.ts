/**
 * Retry Utility with Exponential Backoff
 *
 * Provides a reusable retry mechanism for API calls and other async operations
 * with configurable backoff, jitter, and retry conditions.
 */

import { RETRY_CONFIG } from '@/lib/constants/chat';

export interface RetryOptions {
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries?: number;
  /** Base delay in milliseconds between retries. Default: 1000ms */
  baseDelay?: number;
  /** Maximum delay in milliseconds. Default: 30000ms */
  maxDelay?: number;
  /** Custom function to determine if an error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
  /** Called before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Check if an error is potentially retryable based on common patterns
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('connection') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('socket hang up') ||
    errorName === 'typeerror' && message.includes('failed to fetch')
  ) {
    return true;
  }

  // Rate limiting (429)
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('quota exceeded')
  ) {
    return true;
  }

  // Server errors (5xx)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('bad gateway') ||
    message.includes('service unavailable') ||
    message.includes('gateway timeout')
  ) {
    return true;
  }

  // Temporary/transient errors
  if (
    message.includes('temporary') ||
    message.includes('transient') ||
    message.includes('overloaded') ||
    message.includes('try again')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if an error is an authentication/authorization error (should not retry)
 */
export function isAuthError(error: Error): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    message.includes('api key') ||
    message.includes('api-key') ||
    message.includes('invalid key') ||
    message.includes('permission denied')
  );
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = RETRY_CONFIG.BASE_DELAY,
  maxDelay: number = RETRY_CONFIG.MAX_DELAY
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±20% randomization to prevent thundering herd)
  const jitter = cappedDelay * RETRY_CONFIG.JITTER_FACTOR;
  const minDelay = cappedDelay - jitter;
  const maxJitterDelay = cappedDelay + jitter;

  return Math.floor(minDelay + Math.random() * (maxJitterDelay - minDelay));
}

/**
 * Sleep for a specified duration, respecting abort signal
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Retry aborted'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Retry aborted'));
      };
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries fail
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   async () => await fetchData(),
 *   {
 *     maxRetries: 3,
 *     shouldRetry: (error) => error.message.includes('429'),
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}:`, error.message)
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = RETRY_CONFIG.BASE_DELAY,
    maxDelay = RETRY_CONFIG.MAX_DELAY,
    shouldRetry = isRetryableError,
    signal,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if aborted before attempting
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry auth errors
      if (isAuthError(lastError)) {
        throw lastError;
      }

      // Check if we've exhausted retries
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Check if error is retryable
      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateBackoff(attempt, baseDelay, maxDelay);

      // Notify about retry
      if (onRetry) {
        onRetry(lastError, attempt + 1, delay);
      }

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError.message,
        `Retrying in ${delay}ms...`
      );

      // Wait before retrying
      await sleep(delay, signal);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Create a retry wrapper for a specific function
 * Useful when you want to retry-wrap a function that will be called multiple times
 *
 * @example
 * ```ts
 * const fetchWithRetry = createRetryWrapper(
 *   (url: string) => fetch(url),
 *   { maxRetries: 3 }
 * );
 *
 * const response1 = await fetchWithRetry('https://api.example.com/data1');
 * const response2 = await fetchWithRetry('https://api.example.com/data2');
 * ```
 */
export function createRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}

/**
 * Extract retry-after duration from rate limit responses
 * Returns duration in milliseconds, or null if not found
 */
export function extractRetryAfter(error: Error | Response | Record<string, unknown>): number | null {
  // Check if it's a Response object
  if (error instanceof Response) {
    const retryAfter = error.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return null;
  }

  // Check error message for retry-after hints
  if (error instanceof Error) {
    const match = error.message.match(/retry.?after[:\s]+(\d+)/i);
    if (match) {
      const seconds = parseInt(match[1], 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }

  // Check for retryAfter property on error object
  if (typeof error === 'object' && error !== null && 'retryAfter' in error) {
    const retryAfter = (error as { retryAfter: unknown }).retryAfter;
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000;
    }
  }

  return null;
}
