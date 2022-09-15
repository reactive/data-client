export interface NetworkError extends Error {
  status: number;
  response?: Response;
}

export interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}

export type ErrorTypes = NetworkError | UnknownError;
