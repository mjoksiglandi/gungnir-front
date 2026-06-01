import { cookies } from "next/headers";
import { clearSessionTokens, readSessionTokens, writeSessionTokens } from "@/lib/auth-session";
import { ApiError, getBackendMe, refreshBackendTokens } from "@/lib/api";

export async function GET() {
  const cookieStore = await cookies();
  const { accessToken, refreshToken } = readSessionTokens(cookieStore);

  if (!accessToken && !refreshToken) {
    return Response.json({
      user: null,
    }, { status: 401 });
  }

  try {
    if (accessToken) {
      const user = await getBackendMe(accessToken);
      return Response.json({ user });
    }

    if (!refreshToken) {
      return Response.json({ user: null }, { status: 401 });
    }

    const refreshed = await refreshBackendTokens(refreshToken);
    writeSessionTokens(cookieStore, refreshed);
    const user = await getBackendMe(refreshed.accessToken);

    return Response.json({ user });
  } catch (error) {
    if (refreshToken && error instanceof ApiError && error.status === 401) {
      try {
        const refreshed = await refreshBackendTokens(refreshToken);
        writeSessionTokens(cookieStore, refreshed);
        const user = await getBackendMe(refreshed.accessToken);

        return Response.json({ user });
      } catch {
        clearSessionTokens(cookieStore);
        return Response.json({ user: null }, { status: 401 });
      }
    }

    clearSessionTokens(cookieStore);
    return Response.json({ user: null }, { status: 401 });
  }
}
