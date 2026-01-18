import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "sales" | "reseller";
export type AccountStatus = "pending" | "approved" | "rejected";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  accountStatus: AccountStatus;
  role: AppRole;
  createdAt: string;
}

export function useUserRole() {
  const { user } = useAuth();

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return "reseller" as AppRole;
      }

      return data?.role as AppRole;
    },
    enabled: !!user,
  });

  const { data: accountStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching account status:", error);
        return "pending" as AccountStatus;
      }

      return data?.account_status as AccountStatus;
    },
    enabled: !!user,
  });

  const isAdmin = userRole === "admin";
  const isSales = userRole === "sales";
  const isReseller = userRole === "reseller";
  const isApproved = accountStatus === "approved";
  const isPending = accountStatus === "pending";
  const isRejected = accountStatus === "rejected";

  return {
    role: userRole,
    accountStatus,
    isAdmin,
    isSales,
    isReseller,
    isApproved,
    isPending,
    isRejected,
    isLoading: roleLoading || statusLoading,
  };
}

export function useAllUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-users"],
    queryFn: async (): Promise<UserProfile[]> => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, username, account_status, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get auth users via admin function (we'll use email from profile or placeholder)
      // Since we can't directly query auth.users, we'll use email stored elsewhere
      // For now, we'll show user_id as identifier

      return profiles.map((profile) => {
        const userRoleData = roles.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.id, // Will be replaced with actual email if available
          fullName: profile.full_name,
          username: profile.username,
          accountStatus: profile.account_status as AccountStatus,
          role: (userRoleData?.role as AppRole) || "reseller",
          createdAt: profile.created_at,
        };
      });
    },
    enabled: !!user,
  });
}

export function useManageUsers() {
  const queryClient = useQueryClient();

  const updateAccountStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: AccountStatus }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: status })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });

  return {
    updateAccountStatus: updateAccountStatus.mutateAsync,
    updateUserRole: updateUserRole.mutateAsync,
    isUpdating: updateAccountStatus.isPending || updateUserRole.isPending,
  };
}
