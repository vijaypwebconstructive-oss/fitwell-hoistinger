import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Login from "./login";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
const API_URL = import.meta.env.VITE_API_URL || "";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/protected-check`, {
      credentials: "include",
    })
      .then((res) => {
        setOk(res.ok);
        setLoading(false);
      })
      .catch(() => {
        setOk(false);
        setLoading(false);
      });
  }, []);

  // ⏳ While checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 🔐 Not authenticated → show login page
  if (!ok) {
    return <Login />;
  }

  // ✅ Authenticated → show app
  return <>{children}</>;
}
