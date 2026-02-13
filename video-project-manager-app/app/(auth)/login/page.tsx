"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Signing in...");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setStatus(error.message);
        return;
      }

      setStatus("Signed in. Redirecting...");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setStatus("Missing Supabase credentials. Add env vars to continue.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Welcome</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Sign in to Video Project Manager
        </h2>
        <p className="mt-2 text-sm text-ink-500">Use your Dream Home Shots credentials.</p>
      </header>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-ink-500">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-ink-500">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
          />
        </label>
        {status ? <p className="text-xs text-ink-500">{status}</p> : null}
        <button type="submit" className="rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          Sign in
        </button>
      </form>
      <div className="text-xs text-ink-500">
        <span>Looking for a project overview? </span>
        <Link className="text-ink-900" href="/">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
