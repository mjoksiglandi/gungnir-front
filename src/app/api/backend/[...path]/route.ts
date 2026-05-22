import { cookies } from "next/headers";
import { clearSessionTokens, readSessionTokens, writeSessionTokens } from "@/lib/auth-session";
import { fetchBackend, getBackendApiBaseUrl, refreshBackendTokens } from "@/lib/api";

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
];

async function forwardRequest(
  request: Request,
  path: string[],
  accessToken: string | null,
) {
  const url = new URL(`${getBackendApiBaseUrl()}/${path.join("/")}`);
  const incomingUrl = new URL(request.url);

  for (const [key, value] of incomingUrl.searchParams.entries()) {
    url.searchParams.append(key, value);
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  return fetchBackend(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const { accessToken, refreshToken } = readSessionTokens(cookieStore);

  let response = await forwardRequest(request, path, accessToken);

  if (response.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshBackendTokens(refreshToken);
      writeSessionTokens(cookieStore, refreshed);
      response = await forwardRequest(request, path, refreshed.accessToken);
    } catch {
      clearSessionTokens(cookieStore);
    }
  }

  const payload = await response.text();
  const headers = new Headers();

  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  return new Response(payload, {
    status: response.status,
    headers,
  });
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}
