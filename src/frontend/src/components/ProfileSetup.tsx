import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AccountStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function ProfileSetup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !username.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const apiKey = `bp_${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`;
      await actor.saveCallerUserProfile({
        username: username.trim(),
        email: email.trim(),
        balance: 0,
        accountStatus: AccountStatus.active,
        apiKey,
      });
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile created successfully!");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">BoostPanel</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1">Set up your profile</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Just a few details to get started
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
