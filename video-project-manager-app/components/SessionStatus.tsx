"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SessionState = {
  email: string | null;
  loading: boolean;
};

export function SessionStatus() {
  const [state, setState] = useState<SessionState>({ email: null, loading: true });

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setState({ email: data.user?.email ?? null, loading: false });
      });
    } catch (error) {
      setState({ email: null, loading: false });
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setState({ email: null, loading: false });
    } catch (error) {
      setState({ email: null, loading: false });
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-ink-900/10 bg-white/70 px-4 py-2 text-xs">
      <span className="h-2 w-2 rounded-full bg-ember-500" />
      {state.loading ? (
        <span className="text-ink-300">Checking session...</span>
      ) : state.email ? (
        <>
          <span className="text-ink-700">{state.email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-ink-300 transition hover:text-ink-900"
          >
            Sign out
          </button>
        </>
      ) : (
        <span className="text-ink-300">Supabase not configured</span>
      )}
    </div>
  );
}
