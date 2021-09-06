export default class GQLNetworkError extends Error {
  declare status: number;
  declare errors: GQLError[];
  name = 'NetworkError';

  constructor(errors: GQLError[]) {
    super((errors as any)[0].message);
    this.status = 400;
    this.errors = errors;
  }
}

export interface GQLError {
  message: string;
  locations: { line: number; column: number }[];
  path: (string | number)[];
}
