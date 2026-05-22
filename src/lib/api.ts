import type {
  AuthUserDto,
  BackendApiErrorPayload,
  AuthTokenPairDto,
} from "@/types/api";

const DEFAULT_API_URL = "http://localhost:4000/api";
const DEFAULT_WS_URL = "ws://localhost:4000/realtime";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: BackendApiErrorPayload,
  ) {
    super(message);
  }
}

function isServerRuntime() {
  return typeof window === "undefined";
}

export function getBackendApiBaseUrl() {
  const baseUrl = isServerRuntime()
    ? process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
    : process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

  return baseUrl.replace(/\/$/, "");
}

export function getBackendWsUrl() {
  return (process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL).replace(/\/$/, "");
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendApiBaseUrl()}${normalizedPath}`;
}

function toBackendRequestTarget(input: string | URL | Request) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function toBackendConnectionError(input: string | URL | Request, cause: unknown) {
  const target = toBackendRequestTarget(input);
  const envHint = isServerRuntime()
    ? "Set BACKEND_API_URL in your .env.local to the backend address reachable from Next.js."
    : "Check NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL.";

  const message = `Could not reach backend at ${target}. ${envHint}`;
  return new ApiError(message, 503, { message, error: cause instanceof Error ? cause.message : "NETWORK_ERROR" });
}

async function parseError(response: Response) {
  let payload: BackendApiErrorPayload | undefined;

  try {
    payload = await response.json() as BackendApiErrorPayload;
  } catch {
    payload = undefined;
  }

  const message = Array.isArray(payload?.message)
    ? payload?.message.join(", ")
    : payload?.message ?? payload?.error ?? `Request failed with ${response.status}`;

  return new ApiError(message, response.status, payload);
}

export async function fetchBackend(input: string | URL | Request, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw toBackendConnectionError(input, error);
  }
}

async function fetchJson<T>(input: string, init?: RequestInit) {
  const response = await fetchBackend(input, init);
  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json() as T;
}

async function refreshAccessToken(refreshToken: string) {
  return fetchJson<AuthTokenPairDto>(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}

export const browserApiClient = {
  async get<T>(path: string) {
    return fetchJson<T>(`/api/backend${path}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
  },
  async post<T>(path: string, body?: unknown) {
    return fetchJson<T>(`/api/backend${path}`, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
  },
  async patch<T>(path: string, body?: unknown) {
    return fetchJson<T>(`/api/backend${path}`, {
      method: "PATCH",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
  },
};

export async function loginToBackend(email: string, password: string) {
  return fetchJson<AuthTokenPairDto>(buildUrl("/auth/login"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
}

export async function getBackendMe(accessToken: string) {
  return fetchJson<AuthUserDto>(buildUrl("/auth/me"), {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
}

export async function logoutFromBackend(refreshToken: string) {
  return fetchJson<{ success: true }>(buildUrl("/auth/logout"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}

export async function refreshBackendTokens(refreshToken: string) {
  return refreshAccessToken(refreshToken);
}
