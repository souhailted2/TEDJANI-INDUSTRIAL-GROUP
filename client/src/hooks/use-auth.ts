import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  isParent: boolean;
  role: "company" | "operator" | "app_user";
  phone?: string | null;
  balance?: string;
  debtToParent?: string;
  permissions?: string[];
};

async function fetchMe(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const hasPermission = (section: string): boolean => {
    if (!user) return false;
    if (user.role === "company" && user.isParent) return true;
    if (user.role === "app_user") {
      return (user.permissions || []).includes(section);
    }
    if (user.role === "company") return true;
    return false;
  };

  return {
    company: user?.role === "company" ? user : null,
    user,
    isLoading,
    isAuthenticated: !!user,
    isParent: user?.isParent ?? false,
    isOperator: user?.role === "operator",
    isAppUser: user?.role === "app_user",
    permissions: user?.permissions || [],
    hasPermission,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
