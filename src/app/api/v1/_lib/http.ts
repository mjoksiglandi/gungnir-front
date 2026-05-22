import "server-only";

import { REST_API_VERSION, type RestErrorCode, type RestErrorPayload } from "@/shared/contracts/rest";

class ApiRouteError extends Error {
  constructor(
    readonly status: number,
    readonly code: RestErrorCode,
    message: string,
    readonly details?: Record<string, string | number | boolean>,
  ) {
    super(message);
  }
}

function baseHeaders(init?: ResponseInit) {
  return new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-gugnir-api-version": REST_API_VERSION,
    ...Object.fromEntries(new Headers(init?.headers).entries()),
  });
}

export function okJson(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: baseHeaders(init),
  });
}

export function invalidQuery(message: string, details?: Record<string, string | number | boolean>) {
  throw new ApiRouteError(400, "invalid_query", message, details);
}

export function notFound(resource: string, id: string) {
  throw new ApiRouteError(404, "not_found", `${resource} '${id}' was not found.`, {
    id,
    resource,
  });
}

export function readEnum<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  field: string,
) {
  if (value === null) return undefined;

  if (!allowedValues.includes(value as T)) {
    invalidQuery(`Unsupported '${field}' value.`, {
      allowed: allowedValues.join(","),
      field,
      value,
    });
  }

  return value as T;
}

export function readBoolean(value: string | null, field: string) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;

  invalidQuery(`Unsupported '${field}' boolean value.`, {
    field,
    value,
  });
}

export function readIsoDate(value: string | null, field: string) {
  if (value === null) return undefined;

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    invalidQuery(`Unsupported '${field}' datetime value.`, {
      field,
      value,
    });
  }

  return value;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiRouteError) {
    const payload: RestErrorPayload = {
      error: {
        code: error.code,
        details: error.details,
        message: error.message,
      },
    };

    return okJson(payload, {
      status: error.status,
    });
  }

  throw error;
}
