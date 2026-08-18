/**
 * Statuses worth retrying. Everything else (particularly 4xx) will fail the
 * same way on a second attempt, so retrying only adds latency.
 */
const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);

/** Thrown for any failed upstream call, so callers can branch on the cause. */
export class ApiError extends Error {
  /** Undefined when no response arrived at all - network error or timeout. */
  readonly status?: number;
  readonly method: string;
  readonly url: string;
  /** How many attempts were made in total before giving up. */
  attempts: number;

  constructor(params: {
    method: string;
    url: string;
    status?: number;
    attempts?: number;
    message?: string;
  }) {
    super(
      params.message ??
        `${params.method} ${params.url} failed` +
          (params.status ? ` with ${params.status}` : ' (no response)')
    );

    this.name = 'ApiError';
    this.method = params.method;
    this.url = params.url;
    this.status = params.status;
    this.attempts = params.attempts ?? 1;
  }

  /** A missing status means the request never landed, which is worth a retry. */
  get retryable(): boolean {
    return this.status === undefined || RETRYABLE_STATUSES.has(this.status);
  }
}
