import { Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoading = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">BoostPanel</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your SMM panel
          </p>

          <button
            type="button"
            onClick={() => login()}
            disabled={isLoading}
            className="w-full py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Connecting..." : "Login with Internet Identity"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Secure, passwordless authentication via ICP
          </p>
        </div>

        {/* Support links */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <a
            href="https://t.me/boostpanel"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Telegram Support
          </a>
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
