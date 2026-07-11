import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/get-session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <AppShell
      user={{
        email: session.user.email,
        id: session.user.id,
        image: session.user.image,
        name: session.user.name,
      }}
    >
      {children}
    </AppShell>
  );
}
