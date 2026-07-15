// HONEYMOON — Admin Reports
// User reports and moderation queue with Firestore integration

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertTriangle, CheckCircle, XCircle, Eye, Search, Flag, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import DataPagination from "@/components/DataPagination";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Report } from "@/types";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  dismissed: { label: "Dismissed", color: "bg-muted text-muted-foreground" },
};

const DEMO_REPORTS: Report[] = [
  { id: "r1", reportedBy: "user_001", reportedUser: "user_002", reason: "Inappropriate content", description: "Sending explicit messages without consent", status: "pending", createdAt: null },
  { id: "r2", reportedBy: "user_003", reportedUser: "user_004", reason: "Fake profile", description: "Profile photos appear to be stolen from another person", status: "reviewed", createdAt: null },
  { id: "r3", reportedBy: "user_005", reportedUser: "user_006", reason: "Harassment", description: "Continued messaging after being asked to stop", status: "resolved", createdAt: null },
  { id: "r4", reportedBy: "user_007", reportedUser: "user_008", reason: "Scam", description: "Asking for money after a few messages", status: "pending", createdAt: null },
];

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved" | "dismissed">("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      setReports(data.length > 0 ? data : DEMO_REPORTS);
    } catch {
      setReports(DEMO_REPORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Report["status"]) => {
    if (id.startsWith("r")) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Report marked as ${status}`);
      setSelected(null);
      return;
    }
    try {
      await updateDoc(doc(db, "reports", id), { status });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Report marked as ${status}`);
    } catch {
      toast.error("Failed to update report");
    }
    setSelected(null);
  };

  const filtered = reports.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch = search === "" ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => { setPage(1); }, [search, filter]);

  return (
    <AdminLayout pageTitle="Reports">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Reports</h1>
          <p className="mt-1 text-muted-foreground">
            {pendingCount > 0
              ? <span className="text-amber-600 font-medium">{pendingCount} pending report{pendingCount > 1 ? "s" : ""} need attention</span>
              : "All reports reviewed"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search reports..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "pending", "reviewed", "resolved", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 text-white text-xs px-1.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No reports found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== "all" ? `No ${filter} reports` : "No reports submitted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((r) => {
              const statusConf = STATUS_CONFIG[r.status];
              return (
                <Card key={r.id} className={`transition-all ${r.status === "pending" ? "border-amber-200" : ""}`}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.status === "pending" ? "bg-amber-50" : "bg-muted"}`}>
                      <AlertTriangle size={20} className={r.status === "pending" ? "text-amber-500" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{r.reason}</p>
                        <Badge className={`text-xs ${statusConf.color}`}>{statusConf.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reporter: {r.reportedBy.slice(0, 8)}... · Against: {r.reportedUser.slice(0, 8)}...
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => setSelected(r)}>
                      <Eye size={14} />
                      Review
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Playfair_Display']">Review Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">{selected.reason}</p>
                  <Badge className={`text-xs ${STATUS_CONFIG[selected.status].color}`}>{STATUS_CONFIG[selected.status].label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                  <p>Reported by: <span className="font-mono">{selected.reportedBy}</span></p>
                  <p>Against user: <span className="font-mono">{selected.reportedUser}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50" onClick={() => updateStatus(selected.id, "resolved")}>
                  <CheckCircle size={16} />
                  Resolve
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => updateStatus(selected.id, "dismissed")}>
                  <XCircle size={16} />
                  Dismiss
                </Button>
                <Button className="col-span-2 gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => updateStatus(selected.id, "reviewed")}>
                  <Eye size={16} />
                  Mark as Reviewed
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
