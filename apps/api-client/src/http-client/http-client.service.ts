import { Injectable, Logger } from '@nestjs/common';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  /** Serialised as JSON and sent as the request body. */
  body?: unknown;
  /** Overrides the default per-request timeout. */
  timeoutMs?: number;
}

/** Wrapper class for all HTTP requests in this app to handle unreliable API calls. */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  // TODO: move baseUrl/timeout into ConfigModule rather than reading env here
  private readonly baseUrl =
    process.env.EUROCAMP_API_URL ?? 'http://localhost:3001/api/1';
  private readonly defaultTimeoutMs = Number(
    process.env.EUROCAMP_API_TIMEOUT_MS ?? 5000
  );

  /**
   * Performs a single HTTP call and returns the parsed body
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, timeoutMs = this.defaultTimeoutMs } = options;
    const url = `${this.baseUrl}${path}`;

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

  // TODO: map failures to a typed api error (status, url, attempts) so callers can interpret failures
  // TODO: retry server/network failures only - 502/503/504, timeouts, network errors
  // TODO: exponential backoff, jitter
  // TODO: only retry idempotent verbs by default (GET/DELETE)
  // TODO: short lived TTL cache for GETs
  // TODO: unit tests with jest mocking fetch and fake timers
}
