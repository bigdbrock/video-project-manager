"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  currentEmail: string | null;
};

export default function AccountSettingsForm({ currentEmail }: Props) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleEmailUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setEmailStatus("Enter a new email address.");
      return;
    }

    setSavingEmail(true);
    setEmailStatus("Saving...");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) {
        setEmailStatus(error.message);
        return;
      }
      setEmailStatus("Email update requested. Check your inbox to confirm.");
      setEmail("");
    } catch {
      setEmailStatus("Unable to update email right now.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setPasswordStatus("Password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    setPasswordStatus("Saving...");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordStatus(error.message);
        return;
      }
      setPasswordStatus("Password updated.");
      setPassword("");
    } catch {
      setPasswordStatus("Unable to update password right now.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-panel rounded-xl p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Email</h3>
        <p className="mt-2 text-sm text-ink-500">Current: {currentEmail ?? "Unknown"}</p>
        <form onSubmit={handleEmailUpdate} className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            New email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="name@company.com"
              required
            />
          </label>
          {emailStatus ? <p className="text-xs text-ink-500">{emailStatus}</p> : null}
          <button
            type="submit"
            disabled={savingEmail}
            className="rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {savingEmail ? "Saving..." : "Update email"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-xl p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Password</h3>
        <p className="mt-2 text-sm text-ink-500">Set a new account password.</p>
        <form onSubmit={handlePasswordUpdate} className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </label>
          {passwordStatus ? <p className="text-xs text-ink-500">{passwordStatus}</p> : null}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {savingPassword ? "Saving..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
