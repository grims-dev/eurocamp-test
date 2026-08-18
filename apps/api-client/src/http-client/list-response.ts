/**
 * Upstream wraps collections in a { data: [...] } envelope, but returns a
 * single resource bare. Kept in one place so every resource service agrees.
 */
export interface ListResponse<T> {
  data: T[];
}
