import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useGetCallerUserProfile } from "../hooks/useProfile";

export default function AccountSettings() {
  const { actor } = useActor();
  const { data: profile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !profile) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({
        ...profile,
        username: username.trim(),
        email: email.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const statusClasses =
    profile?.accountStatus === AccountStatus.active
      ? "bg-green-900/40 text-green-400 border border-green-800/50"
      : "bg-red-900/40 text-red-400 border border-red-800/50";

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">Account Settings</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Manage your account details.
      </p>

      {/* Status card */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Status</p>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusClasses}`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {profile?.accountStatus === AccountStatus.active
                ? "Active"
                : "Suspended"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p className="text-xl font-bold text-primary">
              ₹{(profile?.balance ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Profile Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="as-username"
              className="block text-sm font-medium mb-1.5"
            >
              Username
            </label>
            <input
              id="as-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="as-email"
              className="block text-sm font-medium mb-1.5"
            >
              Email
            </label>
            <input
              id="as-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="as-apikey"
              className="block text-sm font-medium mb-1.5"
            >
              API Key
            </label>
            <input
              id="as-apikey"
              value={profile?.apiKey ?? ""}
              readOnly
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
