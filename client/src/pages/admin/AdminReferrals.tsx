// HONEYMOON — Admin Referrals
// Shows the real referrals/{id} schema (referrerId, referredUserId,
// status, paymentId, activities[]) joined against users + payments,
// plus a per-currency wallet breakdown for referrers.

import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, CheckCircle2, Clock, RefreshCw, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/layout/AdminLayout";
import DataPagination from "@/components/DataPagination";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PAGE_SIZE = 10;

function fmtDate(ts: any) {
  if (!ts) return "—";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtMoney(amount: number | undefined, currency: string | undefined) {
  if (amount === undefined || amount === null) return "—";
  return `${currency ?? ""} ${amount.toLocaleString()}`.trim();
}

const STATUS_LABEL: Record<string, string> = {
  pending_signup: "Pending Signup",
  email_verified: "Email Verified",
  subscription_selected: "Plan Selected",
  payment_pending: "Payment Pending",
  payment_completed: "Paid",
  reward_unlocked: "Reward Unlocked",
};

const PAID_STATUSES = ["payment_completed", "reward_unlocked"];

interface ReferralRow {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: string;
  paymentId?: string;
  createdAt?: any;
  paymentCompletedAt?: any;
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const [paymentsByUserId, setPaymentsByUserId] = useState<Record<string, any>>({});
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [referralsSnap, usersSnap, paymentsSnap, earningsSnap] = await Promise.all([
        getDocs(query(collection(db, "referrals"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "earnings")),
      ]);

      setReferrals(referralsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReferralRow)));

      const uMap: Record<string, any> = {};
      usersSnap.docs.forEach((d) => { uMap[d.id] = { id: d.id, ...d.data() }; });
      setUsersById(uMap);

      // Most recent completed payment per user, so we can show what
      // the referred user actually paid.
      const pMap: Record<string, any> = {};
      paymentsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((p) => p.status === "completed" || p.status === "paid" || p.status === "verified")
        .forEach((p) => {
          const existing = pMap[p.userId];
          const pTime = p.completedAt ?? p.paidAt ?? p.createdAt;
          const eTime = existing ? (existing.completedAt ?? existing.paidAt ?? existing.createdAt) : null;
          if (!existing || (pTime?.toMillis?.() ?? 0) > (eTime?.toMillis?.() ?? 0)) {
            pMap[p.userId] = p;
          }
        });
      setPaymentsByUserId(pMap);

      setEarnings(earningsSnap.docs.map((d) => d.data()));
    } catch (err) {
      console.error("Failed to load admin referrals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const paidCount = referrals.filter((r) => PAID_STATUSES.includes(r.status)).length;

  // Commission totals grouped by currency.
  const commissionByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    earnings.forEach((e: any) => {
      if (e.type !== "referral_commission") return;
      totals[e.currency ?? "KES"] = (totals[e.currency ?? "KES"] ?? 0) + (e.amount ?? 0);
    });
    return totals;
  }, [earnings]);

  // Referrers with a nonzero wallet in any currency.
  const wallets = useMemo(() => {
    return Object.values(usersById)
      .filter((u: any) =>
        (u.walletBalances && Object.values(u.walletBalances).some((v: any) => v > 0)) ||
        (u.walletBalance ?? 0) > 0,
      )
      .map((u: any) => {
        const balances: Record<string, number> = { ...(u.walletBalances ?? {}) };
        if (u.walletBalance) balances.KES = balances.KES ?? u.walletBalance;
        return {
          id: u.id,
          name: u.displayName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id,
          referralCount: u.referralCount ?? u.paidReferralCount ?? 0,
          balances,
        };
      })
      .sort((a, b) => {
        const totalA = Object.values(a.balances).reduce((s, v) => s + v, 0);
        const totalB = Object.values(b.balances).reduce((s, v) => s + v, 0);
        return totalB - totalA;
      });
  }, [usersById]);

  const totalPages = Math.max(1, Math.ceil(referrals.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => referrals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [referrals, page]
  );

  return (
    <AdminLayout pageTitle="Referrals">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Referrals</h1>
          <p className="mt-1 text-muted-foreground">{referrals.length} total · {paidCount} paid</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-foreground">{referrals.length}</p><p className="text-xs text-muted-foreground mt-0.5">Total Referrals</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-green-600">{paidCount}</p><p className="text-xs text-muted-foreground mt-0.5">Paid Referrals</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-amber-600">{referrals.length - paidCount}</p><p className="text-xs text-muted-foreground mt-0.5">Pending</p></CardContent></Card>
      </div>

      {/* Commission totals, per currency */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Total Commission Paid Out</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(commissionByCurrency).length === 0 ? (
            <p className="text-sm text-muted-foreground">No commissions recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {Object.entries(commissionByCurrency).map(([currency, total]) => (
                <div key={currency} className="rounded-lg border px-4 py-3">
                  <p className="text-lg font-bold text-foreground">{fmtMoney(total, currency)}</p>
                  <p className="text-xs text-muted-foreground">{currency}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>
      ) : referrals.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Users size={40} className="mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground">No referrals yet</p></CardContent></Card>
      ) : (
        <>
          <Card className="overflow-x-auto mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Referrer's Paid Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((r) => {
                  const referred = usersById[r.referredUserId];
                  const referrer = usersById[r.referrerId];
                  const payment = paymentsByUserId[r.referredUserId];
                  const isPaid = PAID_STATUSES.includes(r.status);

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">
                        {referred?.displayName || referred?.email || r.referredUserId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {referrer?.displayName || referrer?.email || r.referrerId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment ? fmtMoney(payment.amount, payment.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {referrer?.paidReferralCount ?? referrer?.referralCount ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 text-xs ${isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {fmtDate(r.paymentCompletedAt ?? r.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={referrals.length} pageSize={PAGE_SIZE} />
        </>
      )}

      {/* Wallets — per currency, all recorded */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-muted-foreground" />
          <h2 className="font-['Playfair_Display'] text-xl font-bold text-foreground">Referrer Wallets</h2>
        </div>
        {wallets.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No wallet balances recorded yet.</CardContent></Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Paid Referrals</TableHead>
                  <TableHead>Balances</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-sm font-medium">{w.name}</TableCell>
                    <TableCell className="text-sm text-center">{w.referralCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(w.balances).map(([currency, balance]) => (
                          <Badge key={currency} variant="outline" className="text-xs">
                            {fmtMoney(balance as number, currency)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
