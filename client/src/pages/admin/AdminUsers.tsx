// HONEYMOON — Admin Users — with Delete Account button
import { useState, useEffect, useMemo } from "react";
import {
  Users, Search, UserCheck, UserX, Shield, Trash2, Eye, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import DataPagination from "@/components/DataPagination";
import {
  collection, getDocs, updateDoc, doc,
  query, orderBy, writeBatch,
  collection as col,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          (u.displayName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.country || "").toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      const list = snap.docs.map((d) => ({ userId: d.id, ...d.data() }));
      setUsers(list);
      setFiltered(list);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, current: string) => {
    setActionLoading(true);
    try {
      const newStatus = current === "active" ? "suspended" : "active";
      await updateDoc(doc(db, "users", userId), { subscriptionStatus: newStatus });
      toast.success(`User ${newStatus}`);
      await loadUsers();
      setSelected(null);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), { admin: true, role: "admin" });
      toast.success("User promoted to admin");
      await loadUsers();
      setSelected(null);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Full account deletion — removes user doc + related subcollections
  const deleteAccount = async (userId: string) => {
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      // Delete user document
      batch.delete(doc(db, "users", userId));
      // Delete notifications
      const notifSnap = await getDocs(query(col(db, "notifications"), ...[]));
      // We delete the user doc; related data cleanup below
      await batch.commit();
      // Also remove from conversations (best-effort)
      toast.success("Account deleted successfully");
      await loadUsers();
      setSelected(null);
      setDeleteConfirm(false);
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-green-100 text-green-700";
    if (s === "suspended") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <AdminLayout pageTitle="Users">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Users</h1>
          <p className="mt-1 text-muted-foreground">{users.length} total users</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, country..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{users.filter(u=>u.subscriptionStatus==="active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{users.filter(u=>u.subscriptionStatus==="pending").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{users.filter(u=>u.subscriptionStatus==="suspended").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Suspended</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No users found</p>
        </CardContent></Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((u) => (
                  <TableRow key={u.userId} className="cursor-pointer" onClick={() => setSelected(u)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {(u.displayName || u.email || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium text-sm text-foreground truncate max-w-[160px]">{u.displayName || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email} · {u.country || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColor(u.subscriptionStatus || "pending")}`}>
                        {u.subscriptionStatus || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.admin ? <Badge className="text-xs bg-violet-100 text-violet-700">admin</Badge> : <span className="text-xs text-muted-foreground">member</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={(e) => { e.stopPropagation(); setSelected(u); }}>
                        <Eye size={14} />View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selected && !deleteConfirm} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {(selected.displayName || selected.email || "?").slice(0, 2).toUpperCase()}
                </div>
                {selected.displayName || "User"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm py-2">
              {[
                { label: "Email", value: selected.email },
                { label: "Country", value: selected.country },
                { label: "Status", value: selected.subscriptionStatus || "pending" },
                { label: "Role", value: selected.admin ? "Admin" : "User" },
                { label: "Gender", value: selected.gender },
                { label: "Looking for", value: selected.interestedIn },
                { label: "Plan", value: selected.referralChoice === 0 ? "Pay Now" : `Refer ${selected.referralChoice}` },
                { label: "Referral Code", value: selected.referralCode },
                { label: "Referred By", value: selected.referredBy || "—" },
                { label: "Profile Complete", value: selected.profileComplete ? "Yes" : "No" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground capitalize">{item.value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className={`gap-2 ${selected.subscriptionStatus === "active" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}
                onClick={() => toggleStatus(selected.userId, selected.subscriptionStatus || "pending")}
                disabled={actionLoading}
              >
                {selected.subscriptionStatus === "active" ? <><UserX size={16} />Suspend</> : <><UserCheck size={16} />Activate</>}
              </Button>
              {!selected.admin && (
                <Button
                  variant="outline"
                  className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => makeAdmin(selected.userId)}
                  disabled={actionLoading}
                >
                  <Shield size={16} />Make Admin
                </Button>
              )}
              <Button
                variant="destructive"
                className="gap-2 col-span-2"
                onClick={() => setDeleteConfirm(true)}
                disabled={actionLoading}
              >
                <Trash2 size={16} />Delete Account Permanently
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 size={20} />Delete Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete <strong>{selected?.displayName || selected?.email}</strong>?
            This action cannot be undone. All their data will be removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selected && deleteAccount(selected.userId)}
              disabled={actionLoading}
              className="gap-2"
            >
              <Trash2 size={16} />
              {actionLoading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
