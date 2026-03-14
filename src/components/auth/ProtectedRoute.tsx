import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, hasCustomerProfile } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  usePermissions();

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  // Still loading and not timed out
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Logged in but profile check still running and not timed out
  if (hasCustomerProfile === null && !timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No customer profile row found — send to complete-account
  if (hasCustomerProfile === false || (timedOut && hasCustomerProfile === null)) {
    return <Navigate to="/complete-account" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
