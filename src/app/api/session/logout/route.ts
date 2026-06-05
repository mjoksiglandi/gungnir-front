import { cookies } from "next/headers";
import { verifySameOriginRequest } from "@/app/api/_lib/verify-same-origin";
import { clearSessionTokens, readSessionTokens } from "@/lib/auth-session";
import { logoutFromBackend } from "@/lib/api";

export async function POST(request: Request) {
  const sameOriginError = verifySameOriginRequest(request);
  if (sameOriginError) {
    return sameOriginError;
  }

  const cookieStore = await cookies();
  const { refreshToken } = readSessionTokens(cookieStore);

  if (refreshToken) {
    try {
      await logoutFromBackend(refreshToken);
    } catch {
      // Always clear local cookies, even if the backend token is already invalid.
    }
  }

  clearSessionTokens(cookieStore);

  return Response.json({ success: true });
}
