import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAllUsers, useManageUsers, AppRole, AccountStatus, UserProfile } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, X, Shield, ShoppingBag, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const roleLabels: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Administrator", icon: <Shield className="h-3 w-3" />, color: "bg-red-500/10 text-red-600" },
  sales: { label: "Sales", icon: <ShoppingBag className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600" },
  reseller: { label: "Reseller", icon: <Users className="h-3 w-3" />, color: "bg-green-500/10 text-green-600" },
};

const statusLabels: Record<AccountStatus, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-500/10 text-yellow-600" },
  approved: { label: "Disetujui", color: "bg-green-500/10 text-green-600" },
  rejected: { label: "Ditolak", color: "bg-red-500/10 text-red-600" },
};

export function AccountManagement() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAllUsers();
  const { updateAccountStatus, updateUserRole, isUpdating } = useManageUsers();
  
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "role";
    user: UserProfile;
    newRole?: AppRole;
  } | null>(null);

  const pendingUsers = users?.filter(u => u.accountStatus === "pending") || [];
  const allOtherUsers = users?.filter(u => u.accountStatus !== "pending") || [];

  const handleApprove = async (userId: string) => {
    try {
      await updateAccountStatus({ userId, status: "approved" });
      toast.success("Akun berhasil disetujui");
    } catch (error) {
      toast.error("Gagal menyetujui akun");
    }
    setConfirmAction(null);
  };

  const handleReject = async (userId: string) => {
    try {
      await updateAccountStatus({ userId, status: "rejected" });
      toast.success("Akun ditolak");
    } catch (error) {
      toast.error("Gagal menolak akun");
    }
    setConfirmAction(null);
  };

  const handleRoleChange = async (userId: string, role: AppRole) => {
    try {
      await updateUserRole({ userId, role });
      toast.success(`Role berhasil diubah ke ${roleLabels[role].label}`);
    } catch (error) {
      toast.error("Gagal mengubah role");
    }
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Users className="h-5 w-5" />
              Pendaftaran Menunggu Persetujuan
              <Badge variant="secondary" className="ml-2">{pendingUsers.length}</Badge>
            </CardTitle>
            <CardDescription>
              Pengguna berikut menunggu persetujuan untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((pendingUser) => (
                    <TableRow key={pendingUser.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pendingUser.fullName || "Tanpa Nama"}</p>
                          <p className="text-sm text-muted-foreground">@{pendingUser.username || pendingUser.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(pendingUser.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setConfirmAction({ type: "approve", user: pendingUser })}
                            disabled={isUpdating}
                          >
                            <Check className="h-4 w-4" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setConfirmAction({ type: "reject", user: pendingUser })}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4" />
                            Tolak
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manajemen Akun
          </CardTitle>
          <CardDescription>
            Kelola role dan status akun pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOtherUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Belum ada pengguna terdaftar
                    </TableCell>
                  </TableRow>
                ) : (
                  allOtherUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {u.fullName || "Tanpa Nama"}
                            {u.id === user?.id && (
                              <Badge variant="outline" className="ml-2 text-xs">Anda</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">@{u.username || u.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusLabels[u.accountStatus].color}>
                          {statusLabels[u.accountStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.id === user?.id ? (
                          <Badge className={roleLabels[u.role].color}>
                            {roleLabels[u.role].icon}
                            <span className="ml-1">{roleLabels[u.role].label}</span>
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(value: AppRole) => 
                              setConfirmAction({ type: "role", user: u, newRole: value })
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  Administrator
                                </div>
                              </SelectItem>
                              <SelectItem value="sales">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="h-3 w-3" />
                                  Sales
                                </div>
                              </SelectItem>
                              <SelectItem value="reseller">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  Reseller
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.createdAt), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "approve" && "Setujui Pendaftaran?"}
              {confirmAction?.type === "reject" && "Tolak Pendaftaran?"}
              {confirmAction?.type === "role" && "Ubah Role Pengguna?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "approve" && (
                <>
                  Pengguna <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong> akan 
                  mendapatkan akses ke sistem dengan role <strong>Reseller</strong>.
                </>
              )}
              {confirmAction?.type === "reject" && (
                <>
                  Pengguna <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong> akan 
                  ditolak aksesnya ke sistem. Mereka tidak akan bisa login.
                </>
              )}
              {confirmAction?.type === "role" && confirmAction.newRole && (
                <>
                  Ubah role pengguna <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong> menjadi{" "}
                  <strong>{roleLabels[confirmAction.newRole].label}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "approve") {
                  handleApprove(confirmAction.user.id);
                } else if (confirmAction.type === "reject") {
                  handleReject(confirmAction.user.id);
                } else if (confirmAction.type === "role" && confirmAction.newRole) {
                  handleRoleChange(confirmAction.user.id, confirmAction.newRole);
                }
              }}
              className={confirmAction?.type === "reject" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {confirmAction?.type === "approve" && "Ya, Setujui"}
              {confirmAction?.type === "reject" && "Ya, Tolak"}
              {confirmAction?.type === "role" && "Ya, Ubah Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
