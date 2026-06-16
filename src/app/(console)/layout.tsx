import type { ReactNode } from "react";
import { ConsoleShell } from "@/components/layout/console-shell";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAuthenticatedUser();

  return <ConsoleShell>{children}</ConsoleShell>;
}
