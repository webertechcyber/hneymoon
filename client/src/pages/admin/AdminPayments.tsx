// HONEYMOON — Admin Payments
import { useState, useEffect, useMemo, useCallback } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const statusColor: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-700",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    return getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")))
      .then((snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [payments, page]
  );

  return (
    <AdminLayout pageTitle="Payments">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Payments</h1>
          <p className="mt-1 text-muted-foreground">{payments.length} transactions · Total: ${total}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-foreground">${total}</p><p className="text-xs text-muted-foreground mt-0.5">Total Revenue</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-foreground">{payments.length}</p><p className="text-xs text-muted-foreground mt-0.5">Total Transactions</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-foreground">${payments.length > 0 ? (total / payments.length).toFixed(0) : 0}</p><p className="text-xs text-muted-foreground mt-0.5">Avg. Transaction</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>
      ) : payments.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><CreditCard size={40} className="mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground">No payments yet</p></CardContent></Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.userId ? `${p.userId.slice(0, 8)}...` : "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{p.method || p.provider || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{p.amount} {p.currency}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColor[p.status] || "bg-slate-100 text-slate-700"}`}>
                        {p.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={payments.length} pageSize={PAGE_SIZE} />
        </>
      )}
    </AdminLayout>
  );
}
