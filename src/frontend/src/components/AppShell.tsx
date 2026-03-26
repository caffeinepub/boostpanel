import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Key,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useProfile";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/new-order", label: "New Order", icon: PlusCircle },
  { path: "/mass-order", label: "Mass Order", icon: List },
  { path: "/orders", label: "Orders", icon: ArrowLeftRight },
  { path: "/add-funds", label: "Add Funds", icon: Wallet },
  { path: "/services", label: "Services", icon: Server },
  { path: "/api", label: "API", icon: Key },
  { path: "/settings", label: "Account Settings", icon: Settings },
];

function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { data } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !isFetching,
  });
  return !!data;
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const isAdmin = useIsAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sidebar-foreground">BoostPanel</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              location.pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Support & user */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex gap-2 px-2">
          <a
            href="https://t.me/boostpanel"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Telegram
          </a>
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
        <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-sidebar-accent/40">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-xs font-medium truncate">
              {profile?.username ?? "Loading..."}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-56 z-50">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {/* page title based on path */}
              {[
                ...navItems,
                { path: "/admin", label: "Admin Panel" },
                { path: "/transactions", label: "Transactions" },
              ].find((n) => n.path === location.pathname)?.label ??
                "BoostPanel"}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Live chat float */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all"
        title="WhatsApp Support"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}
