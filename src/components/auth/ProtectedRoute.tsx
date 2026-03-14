import { ReactNode, useState, useEffect } from "react";
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
  usePermissions();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If profile check failed/timed out or explicitly false, redirect to complete-account
  if (
    hasCustomerProfile === false ||
    (timedOut && hasCustomerProfile === null)
  ) {
    if (location.pathname !== "/complete-account") {
      return <Navigate to="/complete-account" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
