import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/domain";
import AccountSettingsForm from "./AccountSettingsForm";

type SettingsSearchParams = {
  adminStatus?: string;
  adminError?: string;
};

type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
};

function getSafeRole(value: string): UserRole {
  if (value === "admin" || value === "qc" || value === "editor") return value;
  return "editor";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const currentRole = getSafeRole(profile?.role ?? "editor");
  const isAdmin = currentRole === "admin";

  async function inviteUser(formData: FormData) {
    "use server";

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        redirect("/login");
      }

      const { data: actionProfile } = await supabaseAction
        .from("profiles")
        .select("role")
        .eq("id", actionUser.id)
        .maybeSingle();

      if (actionProfile?.role !== "admin") {
        redirect("/settings?adminError=Only+admins+can+invite+users.");
      }

      const username = String(formData.get("username") || "").trim();
      const email = String(formData.get("email") || "").trim().toLowerCase();
      const password = String(formData.get("password") || "").trim();
      const role = getSafeRole(String(formData.get("role") || "editor"));

      if (!username || !email || password.length < 8) {
        redirect("/settings?adminError=Provide+username,+email,+and+password+(8%2B+chars).");
      }

      const adminClient = createSupabaseAdminClient();
      const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          username,
          temporary_password: password,
          role,
        },
      });

      if (inviteResult.error) {
        redirect(`/settings?adminError=${encodeURIComponent(inviteResult.error.message)}`);
      }

      const invitedUserId = inviteResult.data.user?.id;
      if (invitedUserId) {
        await adminClient.auth.admin.updateUserById(invitedUserId, {
          password,
          user_metadata: { username, role },
        });
        await adminClient.from("profiles").upsert({
          id: invitedUserId,
          full_name: username,
          role,
        });
      }

      redirect("/settings?adminStatus=Invite+sent+successfully.");
    } catch {
      redirect("/settings?adminError=Invite+failed.+Check+service-role+configuration.");
    }
  }

  async function updateUserRole(formData: FormData) {
    "use server";

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        redirect("/login");
      }

      const { data: actionProfile } = await supabaseAction
        .from("profiles")
        .select("role")
        .eq("id", actionUser.id)
        .maybeSingle();

      if (actionProfile?.role !== "admin") {
        redirect("/settings?adminError=Only+admins+can+change+roles.");
      }

      const userId = String(formData.get("user_id") || "").trim();
      const role = getSafeRole(String(formData.get("role") || "editor"));

      if (!userId) {
        redirect("/settings?adminError=Missing+user+id.");
      }

      const adminClient = createSupabaseAdminClient();
      const { error: updateError } = await adminClient
        .from("profiles")
        .upsert({ id: userId, role }, { onConflict: "id" });

      if (updateError) {
        redirect(`/settings?adminError=${encodeURIComponent(updateError.message)}`);
      }

      redirect("/settings?adminStatus=Role+updated.");
    } catch {
      redirect("/settings?adminError=Role+update+failed.");
    }
  }

  let managedUsers: ManagedUser[] = [];
  let adminLoadError: string | null = null;

  if (isAdmin) {
    try {
      const adminClient = createSupabaseAdminClient();
      const [{ data: usersResult, error: usersError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          adminClient.auth.admin.listUsers({ page: 1, perPage: 500 }),
          adminClient.from("profiles").select("id,full_name,role"),
        ]);

      if (usersError) {
        adminLoadError = usersError.message;
      } else if (profilesError) {
        adminLoadError = profilesError.message;
      } else {
        const profileById = new Map(
          (profilesData ?? []).map((item) => [
            item.id,
            { full_name: item.full_name, role: getSafeRole(item.role ?? "editor") },
          ])
        );

        managedUsers = (usersResult?.users ?? []).map((authUser) => {
          const profileRow = profileById.get(authUser.id);
          return {
            id: authUser.id,
            email: authUser.email ?? "No email",
            full_name: profileRow?.full_name ?? null,
            role: profileRow?.role ?? "editor",
          };
        });
      }
    } catch {
      adminLoadError = "Admin tools require SUPABASE_SERVICE_ROLE_KEY in environment variables.";
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Account</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Settings
        </h2>
        <p className="mt-2 text-sm text-ink-500">Update your credentials and admin user access.</p>
      </header>

      <AccountSettingsForm currentEmail={user.email ?? null} />

      {isAdmin ? (
        <section className="grid gap-6">
          {params.adminStatus ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              {params.adminStatus}
            </div>
          ) : null}
          {params.adminError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {params.adminError}
            </div>
          ) : null}
          {adminLoadError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {adminLoadError}
            </div>
          ) : null}

          <div className="glass-panel rounded-xl p-6 shadow-card">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Invite user</h3>
            <p className="mt-2 text-sm text-ink-500">
              Sends an invite email to the address provided.
            </p>
            <p className="mt-1 text-xs text-ink-400">
              To include username/password in the email body, add those metadata fields to your Supabase invite template.
            </p>
            <form action={inviteUser} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Username
                <input
                  name="username"
                  required
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
                  placeholder="First Last"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
                  placeholder="user@company.com"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Temporary password
                <input
                  type="text"
                  name="password"
                  required
                  minLength={8}
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
                  placeholder="At least 8 characters"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Role
                <select
                  name="role"
                  defaultValue="editor"
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
                >
                  <option value="editor">Editor</option>
                  <option value="qc">QC</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-card">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Manage users</h3>
            <div className="mt-4 space-y-3">
              {managedUsers.map((managedUser) => (
                <form
                  key={managedUser.id}
                  action={updateUserRole}
                  className="grid gap-3 rounded-xl border border-ink-900/10 bg-white/70 p-3 md:grid-cols-[1.5fr_1fr_auto]"
                >
                  <input type="hidden" name="user_id" value={managedUser.id} />
                  <div className="text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">{managedUser.full_name ?? "Unnamed user"}</p>
                    <p className="text-xs text-ink-500">{managedUser.email}</p>
                  </div>
                  <select
                    name="role"
                    defaultValue={managedUser.role}
                    className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="qc">QC</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    Save role
                  </button>
                </form>
              ))}
              {!managedUsers.length ? (
                <p className="text-sm text-ink-500">No registered users found.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
