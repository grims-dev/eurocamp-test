import { Injectable, Logger } from '@nestjs/common';

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
}

/** Methods safe to replay. */
const IDEMPOTENT_METHODS = ['GET', 'DELETE'];

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

  /**
   * Performs an HTTP call, retrying transient failures.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      retries = this.defaultRetries,
      retryDelayMs = this.defaultRetryDelayMs,
    } = options;

    const url = `${this.baseUrl}${path}`;
    const maxAttempts = IDEMPOTENT_METHODS.includes(method) ? retries + 1 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.attempt<T>(url, method, options);
      } catch (error) {
        // A non-transient failure will not fix itself, so fail fast. The final
        // attempt throws here too, so the loop never falls out of the bottom.
        if (attempt === maxAttempts) {
          throw error;
        }

        const delay = this.backoffDelay(attempt, retryDelayMs);

        this.logger.warn(
          `${method} ${url} failed (${error instanceof Error ? error.message : String(error)}), ` +
            `retrying in ${delay}ms [${attempt}/${maxAttempts}]`
        );

        await this.sleep(delay);
      }
    }

    // Only reachable if maxAttempts were somehow below one.
    throw new Error(`Request failed with ${maxAttempts} attempts`);
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
      // TODO: replace with a typed ApiError carrying status/url/attempts
      throw new Error(`${method} ${url} failed with ${response.status}`);
    }

    return (await response.json()) as T;
  }

  /** Exponential backoff with jitter. */
  private backoffDelay(attempt: number, baseDelayMs: number): number {
    const exponential = baseDelayMs * 2 ** (attempt - 1);

    return Math.round(Math.random() * Math.min(exponential, this.maxRetryDelayMs));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // TODO: map failures to a typed api error (status, url, attempts) so callers can interpret failures
  // TODO: retry server/network failures only - 502/503/504, timeouts, network errors
  // TODO: short lived TTL cache for GETs
  // TODO: unit tests with jest mocking fetch and fake timers
}
