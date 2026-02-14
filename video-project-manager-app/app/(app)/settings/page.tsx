import { createServerSupabaseClient } from "@/lib/supabase/server";
import AccountSettingsForm from "./AccountSettingsForm";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Account</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Settings
        </h2>
        <p className="mt-2 text-sm text-ink-500">Update the email and password for your account.</p>
      </header>

      <AccountSettingsForm currentEmail={user?.email ?? null} />
    </section>
  );
}
