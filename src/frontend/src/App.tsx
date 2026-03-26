import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProfileSetup from "./components/ProfileSetup";
import { Toaster } from "./components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useProfile";
import AccountSettings from "./pages/AccountSettings";
import AddFunds from "./pages/AddFunds";
import AdminPanel from "./pages/AdminPanel";
import ApiPage from "./pages/ApiPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import MassOrder from "./pages/MassOrder";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";

function AuthenticatedApp() {
  const { data: profile, isLoading, isFetched } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();

  const showSetup = !!identity && isFetched && !isLoading && profile === null;

  if (isLoading && !isFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showSetup) {
    return <ProfileSetup />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/mass-order" element={<MassOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/add-funds" element={<AddFunds />} />
        <Route path="/services" element={<Services />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      {!identity ? <LoginPage /> : <AuthenticatedApp />}
    </BrowserRouter>
  );
}
