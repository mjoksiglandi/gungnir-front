import "server-only";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { serverApiClient } from "@/lib/api-server";

export async function requireAuthenticatedUser() {
  try {
    return await serverApiClient.getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }

    throw error;
  }
}
