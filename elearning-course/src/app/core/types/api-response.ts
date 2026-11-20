export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
  pagination?: ApiPagination;
  /** Backward compatibility while older API handlers are being migrated. */
  result?: { data?: T; pagination?: ApiPagination };
}
