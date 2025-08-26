export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage?: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  data: T;
  // Optional non-pagination metadata for specific endpoints (e.g., helper fields).
  // Pagination MUST use the top-level fields defined in PaginatedResponse<T>.
  meta?: Record<string, any>;
}
