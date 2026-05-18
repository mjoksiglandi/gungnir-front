import "server-only";

import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { AuthTokenPairDto } from "@/types/api";

export const ACCESS_TOKEN_COOKIE = "gungnir_access_token";
export const REFRESH_TOKEN_COOKIE = "gungnir_refresh_token";

function ttlToSeconds(value: string) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 60 * 15;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = unit === "s"
    ? 1
    : unit === "m"
      ? 60
      : unit === "h"
        ? 3600
        : 86400;

  return amount * multiplier;
}

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function readSessionTokens(cookies: { get(name: string): { value: string } | undefined }) {
  return {
    accessToken: cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}

export function writeSessionTokens(cookies: ResponseCookies, tokenPair: AuthTokenPairDto) {
  cookies.set(ACCESS_TOKEN_COOKIE, tokenPair.accessToken, baseCookieOptions(ttlToSeconds(tokenPair.expiresIn)));
  cookies.set(REFRESH_TOKEN_COOKIE, tokenPair.refreshToken, baseCookieOptions(60 * 60 * 24 * 30));
}

export function clearSessionTokens(cookies: ResponseCookies) {
  cookies.set(ACCESS_TOKEN_COOKIE, "", baseCookieOptions(0));
  cookies.set(REFRESH_TOKEN_COOKIE, "", baseCookieOptions(0));
}
