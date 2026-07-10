import { redirect } from "next/navigation";

import { DashboardNavbar } from "@/components/dashboard-navbar";
import { getSession } from "@/lib/get-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNavbar
        user={{
          email: session.user.email,
          name: session.user.name,
        }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
