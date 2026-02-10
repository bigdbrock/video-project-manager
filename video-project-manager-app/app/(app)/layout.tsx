import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "editor") as UserRole;
  const userName = profile?.full_name ?? user.email ?? "Team member";

  return (
    <div className="app-shell flex">
      <Sidebar role={role} userName={userName} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar role={role} userName={userName} />
        <main className="flex-1 px-8 py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
