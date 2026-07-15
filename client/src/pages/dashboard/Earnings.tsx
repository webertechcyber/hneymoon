// HONEYMOON — Earnings & Wallet Page
// Wallet balance + referral commission history. Fetched once on load
// and via the Refresh button. History table is paginated.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, TrendingUp, Gift, RefreshCw, ArrowDownToLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataPagination from "@/components/DataPagination";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import paymentService from "@/services/payment.service";

const PAGE_SIZE = 8;

function fmtDate(ts: any) {
  if (!ts) return "—";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const statusColor: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  withdrawn: "bg-slate-100 text-slate-700",
};

export default function EarningsPage() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<{ balance: number; lifetime: number; referral: number } | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [w, e] = await Promise.all([
        paymentService.getWallet(user.uid),
        paymentService.getUserEarnings(user.uid),
      ]);
      setWallet(w);
      setEarnings(e);
    } catch {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(earnings.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => earnings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [earnings, page]
  );

  const handleWithdraw = async () => {
    const value = Number(amount);
    if (!user || !value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (wallet && value > wallet.balance) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.requestWithdrawal(user.uid, value);
      toast.success("Withdrawal requested — pending admin approval");
      setWithdrawOpen(false);
      setAmount("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const currency = profile?.currency || "KES";

  return (
    <DashboardLayout pageTitle="Earnings">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Earnings & Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your referral commissions and request withdrawals</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Available balance</p>
              <Wallet size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currency} {(wallet?.balance ?? 0).toLocaleString()}
            </p>
            <Button size="sm" className="mt-3 gap-2" onClick={() => setWithdrawOpen(true)} disabled={!wallet?.balance}>
              <ArrowDownToLine size={14} />Withdraw
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Lifetime earnings</p>
              <TrendingUp size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currency} {(wallet?.lifetime ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Referral earnings</p>
              <Gift size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currency} {(wallet?.referral ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : earnings.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <Gift size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No earnings yet — invite friends to start earning.</p>
        </CardContent></Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">{fmtDate(e.createdAt)}</TableCell>
                    <TableCell className="text-sm capitalize">{(e.type || "").replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-sm font-medium">{e.currency || currency} {Number(e.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColor[e.status] || "bg-slate-100 text-slate-700"}`}>
                        {e.status || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={earnings.length} pageSize={PAGE_SIZE} />
        </>
      )}

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Request withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input id="amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            <p className="text-xs text-muted-foreground">Available: {currency} {(wallet?.balance ?? 0).toLocaleString()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={submitting}>{submitting ? "Submitting..." : "Request Withdrawal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
