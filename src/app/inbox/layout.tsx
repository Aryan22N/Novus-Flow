"use client";

import { api } from "~/trpc/react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "~/server/better-auth/client";
import { useEffect } from "react";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  const { data: connectedIntegrations = [], isPending: isChecking } =
    api.account.getConnectedIntegrations.useQuery(undefined, {
      enabled: !!session?.user,
    });

  const isPending = isSessionPending || isChecking;
  const hasEmail = connectedIntegrations.includes("gmail");
  const hasCalendar = connectedIntegrations.includes("googlecalendar");

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/");
      } else if (!hasEmail || !hasCalendar) {
        router.push("/onboarding");
      }
    }
  }, [isPending, session, hasEmail, hasCalendar, router]);

  // Prevent rendering children (and triggering sub-components) until fully verified
  if (isPending || !session?.user || !hasEmail || !hasCalendar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return <>{children}</>;
}
