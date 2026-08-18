import { Injectable, Logger } from "@nestjs/common";
import { ApiError } from "./api.error";

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  /** Serialised as JSON and sent as the request body. */
  body?: unknown;
  /** Overrides the default per-request timeout. */
  timeoutMs?: number;
  /** Overrides how many times a failed call is retried. */
  retries?: number;
  /** Base delay for backoff. */
  retryDelayMs?: number;
  /** Overrides how long a GET is cached for. Zero disables caching. */
  cacheTtlMs?: number;
}

/** Methods safe to replay. */
const IDEMPOTENT_METHODS = ['GET', 'DELETE'];

interface CacheEntry {
  expiresAt: number;
  /** The in-flight promise, so identical concurrent GETs share one request. */
  value: Promise<unknown>;
}

/** Wrapper class for all HTTP requests in this app to handle unreliable API calls. */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  // TODO: move these into ConfigModule rather than reading env here
  private readonly baseUrl =
    process.env.EUROCAMP_API_URL ?? 'http://localhost:3001/api/1';
  private readonly defaultTimeoutMs = Number(
    process.env.EUROCAMP_API_TIMEOUT_MS ?? 5000
  );
  private readonly defaultRetries = Number(
    process.env.EUROCAMP_API_RETRIES ?? 3
  );
  private readonly defaultRetryDelayMs = 200;
  private readonly maxRetryDelayMs = 2000;
  private readonly defaultCacheTtlMs = Number(
    process.env.EUROCAMP_API_CACHE_TTL_MS ?? 5000
  );

  // TODO: bound the size (or swap for an LRU) if this ever held more than a
  // handful of short lived entries.
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Performs an HTTP call, serving GETs from a short lived cache and
   * retrying transient failures. Throws an ApiError once retries are exhausted.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', cacheTtlMs = this.defaultCacheTtlMs } = options;
    const url = `${this.baseUrl}${path}`;

    if (method !== 'GET') {
      const result = await this.withRetry<T>(url, method, options);

      // A write may have invalidated anything we are holding.
      this.cache.clear();

      return result;
    }

    if (cacheTtlMs <= 0) {
      return this.withRetry<T>(url, method, options);
    }

    const cached = this.cache.get(url);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log(`cache hit ${url}`);

      return cached.value as Promise<T>;
    }

    // Stored before it settles, so concurrent callers wait on one request
    // rather than each firing their own.
    const pending = this.withRetry<T>(url, method, options);

    this.cache.set(url, { expiresAt: Date.now() + cacheTtlMs, value: pending });

    // Never cache a failure - the next caller should get a fresh attempt.
    pending.catch(() => this.cache.delete(url));

    return pending;
  }

  /** Repeats an attempt while the failure looks transient. */
  private async withRetry<T>(
    url: string,
    method: string,
    options: RequestOptions
  ): Promise<T> {
    const {
      retries = this.defaultRetries,
      retryDelayMs = this.defaultRetryDelayMs,
    } = options;

    const maxAttempts = IDEMPOTENT_METHODS.includes(method) ? retries + 1 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.attempt<T>(url, method, options);
      } catch (error) {
        const apiError = this.toApiError(error, method, url);
        apiError.attempts = attempt;

        // A non-transient failure will not fix itself, so fail fast. The final
        // attempt throws here too, so the loop never falls out of the bottom.
        if (!apiError.retryable || attempt === maxAttempts) {
          throw apiError;
        }

        const delay = this.backoffDelay(attempt, retryDelayMs);

        this.logger.warn(
          `${method} ${url} failed (${apiError.status ?? 'no response'}), ` +
            `retrying in ${delay}ms [${attempt}/${maxAttempts}]`
        );

        await this.sleep(delay);
      }
    }

    // Only reachable if maxAttempts were somehow below one.
    throw new ApiError({ method, url, message: `${method} ${url}: no attempts made` });
  }

  /** A single HTTP request attempt. */
  private async attempt<T>(
    url: string,
    method: string,
    options: RequestOptions
  ): Promise<T> {
    const { body, timeoutMs = this.defaultTimeoutMs } = options;

    this.logger.log(`${method} ${url}`);

    // Timeout for if server hangs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new ApiError({ method, url, status: response.status });
    }
    
    // 204 responses (eg. DELETE) have no body to parse.
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  /** Network failures and timeouts arrive as plain Errors, not ApiErrors. */
  private toApiError(error: unknown, method: string, url: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    return new ApiError({ method, url, message: `${method} ${url}: ${message}` });
  }

  /** Exponential backoff with jitter. */
  private backoffDelay(attempt: number, baseDelayMs: number): number {
    const exponential = baseDelayMs * 2 ** (attempt - 1);

    return Math.round(Math.random() * Math.min(exponential, this.maxRetryDelayMs));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
