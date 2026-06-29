import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AuthStatus {
  isAuthenticated: boolean;
}

function useAuthStatus() {
  return useQuery<AuthStatus>({
    queryKey: ["/api/auth/protected-check"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/auth/protected-check`, {
        credentials: "include",
      });

      return {
        isAuthenticated: res.ok,
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const authStatus = useAuthStatus();

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      queryClient.clear();
      setLocation("/login");
      window.location.reload();
    },
  });

  return {
    isAuthenticated: authStatus.data?.isAuthenticated ?? false,
    isLoading: authStatus.isLoading,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}
