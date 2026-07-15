// HONEYMOON — Admin Withdrawals Management
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CreditCard, Check, X, Clock, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DataPagination from "@/components/DataPagination";
import {
  getAllWithdrawals,
  approveWithdrawal,
  declineWithdrawal,
  processWithdrawal,
} from "@/services/subscription.service";

const PAGE_SIZE = 10;

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "processed";
  requestedAt: any;
  approvedAt?: any;
  processedAt?: any;
  rejectionReason?: string;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => { setPage(1); }, [filterStatus]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await getAllWithdrawals();
      setWithdrawals(data as Withdrawal[]);
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      setActionLoading(true);
      await approveWithdrawal(withdrawal.id);
      toast.success("Withdrawal approved");
      await loadWithdrawals();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve withdrawal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedWithdrawal || !declineReason) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setActionLoading(true);
      await declineWithdrawal(selectedWithdrawal.id, declineReason);
      toast.success("Withdrawal declined");
      setShowDeclineDialog(false);
      setDeclineReason("");
      setSelectedWithdrawal(null);
      await loadWithdrawals();
    } catch (error) {
      console.error("Failed to decline:", error);
      toast.error("Failed to decline withdrawal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async (withdrawal: Withdrawal) => {
    try {
      setActionLoading(true);
      await processWithdrawal(withdrawal.id);
      toast.success("Withdrawal processed");
      await loadWithdrawals();
    } catch (error) {
      console.error("Failed to process:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWithdrawals =
    filterStatus === "all"
      ? withdrawals
      : withdrawals.filter((w) => w.status === filterStatus);

  const totalPages = Math.max(1, Math.ceil(filteredWithdrawals.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filteredWithdrawals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredWithdrawals, page]
  );

  const stats = {
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    processed: withdrawals.filter((w) => w.status === "processed").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      approved: "secondary",
      processed: "outline",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "approved":
        return <Check size={16} className="text-blue-500" />;
      case "processed":
        return <Check size={16} className="text-green-500" />;
      case "rejected":
        return <X size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout pageTitle="Withdrawals">
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Manage user withdrawal requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadWithdrawals} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats.pending, color: "bg-yellow-50" },
          { label: "Approved", value: stats.approved, color: "bg-blue-50" },
          { label: "Processed", value: stats.processed, color: "bg-green-50" },
          { label: "Rejected", value: stats.rejected, color: "bg-red-50" },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "processed", "rejected"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            size="sm"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No withdrawals found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-mono text-sm">
                        {withdrawal.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-semibold">
                        {withdrawal.currency} {withdrawal.amount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          {getStatusBadge(withdrawal.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {withdrawal.requestedAt?.toDate?.().toLocaleDateString() || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {withdrawal.rejectionReason || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {withdrawal.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(withdrawal)}
                                disabled={actionLoading}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowDeclineDialog(true);
                                }}
                                disabled={actionLoading}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {withdrawal.status === "approved" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleProcess(withdrawal)}
                              disabled={actionLoading}
                            >
                              Process
                            </Button>
                          )}
                          {withdrawal.status === "processed" && (
                            <Badge variant="outline">Completed</Badge>
                          )}
                          {withdrawal.status === "rejected" && (
                            <Badge variant="destructive">Declined</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && filteredWithdrawals.length > 0 && (
        <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredWithdrawals.length} pageSize={PAGE_SIZE} />
      )}

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Withdrawal Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Decline</Label>
              <Textarea
                placeholder="Explain why this withdrawal is being declined..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setDeclineReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={actionLoading || !declineReason}
            >
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
