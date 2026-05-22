import { cookies } from "next/headers";
import { clearSessionTokens, writeSessionTokens } from "@/lib/auth-session";
import { ApiError, getBackendMe, loginToBackend } from "@/lib/api";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  try {
    const body = await request.json() as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return Response.json({
        error: {
          message: "Email and password are required.",
        },
      }, { status: 400 });
    }

    const tokenPair = await loginToBackend(body.email, body.password);
    writeSessionTokens(cookieStore, tokenPair);
    const user = await getBackendMe(tokenPair.accessToken);

    return Response.json({
      tokenType: tokenPair.tokenType,
      user,
    });
  } catch (error) {
    clearSessionTokens(cookieStore);

    if (error instanceof ApiError) {
      return Response.json({
        error: {
          message: error.message,
          status: error.status,
        },
      }, { status: error.status });
    }

    throw error;
  }
}
