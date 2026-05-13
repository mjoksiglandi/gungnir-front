export const REST_API_VERSION = "v1" as const;

export type RestApiVersion = typeof REST_API_VERSION;

export type RestErrorCode =
  | "invalid_query"
  | "not_found";

export interface RestErrorPayload {
  error: {
    code: RestErrorCode;
    details?: Record<string, string | number | boolean>;
    message: string;
  };
}
