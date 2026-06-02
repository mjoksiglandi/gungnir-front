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

function canUseCurlFallback() {
  return isServerRuntime() && process.platform === "win32";
}

async function runCurlCommand(command: string, args: string[], body?: string | Uint8Array) {
  const { spawn } = await import("node:child_process");
  const result = await new Promise<{ stdout: Buffer[]; stderr: Buffer[]; code: number | null }>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));

    if (body !== undefined) {
      child.stdin.end(body);
    } else {
      child.stdin.end();
    }
  });

  if (result.code !== 0) {
    const stderr = Buffer.concat(result.stderr).toString("utf8").trim() || `${command} exited with code ${result.code}`;
    throw new Error(stderr);
  }

  return Buffer.concat(result.stdout);
}

function parseCurlResponse(raw: Buffer) {
  const separator = raw.indexOf(Buffer.from("\r\n\r\n"));
  if (separator === -1) {
    throw new Error("Invalid curl response");
  }

  const headerText = raw.subarray(0, separator).toString("utf8");
  const bodyBytes = raw.subarray(separator + 4);
  const headerLines = headerText.split("\r\n");
  const statusLine = headerLines.shift();
  const statusMatch = statusLine?.match(/^HTTP\/\d+(?:\.\d+)?\s+(\d{3})/);

  if (!statusMatch) {
    throw new Error(`Invalid status line from curl: ${statusLine ?? "missing"}`);
  }

  const responseHeaders = new Headers();
  for (const line of headerLines) {
    const index = line.indexOf(":");
    if (index <= 0) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    responseHeaders.append(key, value);
  }

  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(new Uint8Array(bodyBytes), {
    status: Number(statusMatch[1]),
    headers: responseHeaders,
  });
}

async function fetchBackendViaCurl(input: string | URL | Request, init?: RequestInit) {
  const target = toBackendRequestTarget(input);
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  const requestHeaders = new Headers(input instanceof Request ? input.headers : undefined);

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      requestHeaders.set(key, value);
    });
  }

  const curlArgs = [
    "--silent",
    "--show-error",
    "--include",
    "--max-time",
    "20",
    "--request",
    method,
  ];

  requestHeaders.forEach((value, key) => {
    curlArgs.push("--header", `${key}: ${value}`);
  });

  curlArgs.push(target);

  const body =
    typeof init?.body === "string" || init?.body instanceof Uint8Array
      ? init.body
      : input instanceof Request
        ? await input.text()
        : undefined;

  if (body !== undefined) {
    curlArgs.push("--data-binary", "@-");
  }

  try {
    const raw = await runCurlCommand("curl.exe", curlArgs, body);
    return parseCurlResponse(raw);
  } catch (windowsCurlError) {
    const shellCommandParts = ["curl"];
    for (const arg of curlArgs) {
      shellCommandParts.push(`'${arg.replaceAll("'", "'\"'\"'")}'`);
    }
    const wslArgs = ["-d", "Ubuntu", "--", "bash", "-lc", shellCommandParts.join(" ")];

    try {
      const raw = await runCurlCommand("wsl.exe", wslArgs, body);
      return parseCurlResponse(raw);
    } catch (wslCurlError) {
      const windowsMessage = windowsCurlError instanceof Error ? windowsCurlError.message : "curl.exe failed";
      const wslMessage = wslCurlError instanceof Error ? wslCurlError.message : "wsl.exe curl failed";
      throw new Error(`${windowsMessage}; ${wslMessage}`);
    }
  }
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
    if (canUseCurlFallback()) {
      try {
        return await fetchBackendViaCurl(input, init);
      } catch (curlError) {
        throw toBackendConnectionError(input, curlError);
      }
    }

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
