import { redirect } from "next/navigation";

import { getSession } from "@/lib/get-session";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
