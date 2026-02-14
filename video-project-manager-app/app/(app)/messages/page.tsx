import { createServerSupabaseClient } from "@/lib/supabase/server";
import MessagesInbox from "./MessagesInbox";

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Inbox</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Messages
        </h2>
        <p className="mt-2 text-sm text-ink-500">Unread chat updates across your projects.</p>
      </header>

      <MessagesInbox currentUserId={user.id} />
    </section>
  );
}
