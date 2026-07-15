// HONEYMOON — Admin Opportunities
// Full listing management: toggle availability, delete, top up with more
// seed listings. Fetched once on load / via Refresh (no live listeners).

import { useState, useEffect, useMemo, useCallback } from "react";
import { Briefcase, RefreshCw, Trash2, Plus, Eye, EyeOff, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import DataPagination from "@/components/DataPagination";
import {
  getAllOpportunities,
  setOpportunityAvailability,
  deleteOpportunity,
  addMoreOpportunities,
  seedOpportunitiesIfEmpty,
  relativeTime,
  type OpportunityDoc,
} from "@/services/opportunity.service";

const PAGE_SIZE = 10;

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await seedOpportunitiesIfEmpty();
      const data = await getAllOpportunities();
      setOpportunities(data);
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = opportunities.filter((o) =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.company.toLowerCase().includes(search.toLowerCase()),
  );

  const availableCount = opportunities.filter((o) => o.available).length;

  const toggleAvailability = async (opp: OpportunityDoc) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, available: !o.available } : o)),
    );
    try {
      await setOpportunityAvailability(opp.id, !opp.available);
      toast.success(`"${opp.title}" is now ${!opp.available ? "available" : "unavailable"}`);
    } catch {
      toast.error("Failed to update availability");
      load();
    }
  };

  const handleDelete = async (opp: OpportunityDoc) => {
    if (!confirm(`Delete "${opp.title}"? This cannot be undone.`)) return;
    try {
      await deleteOpportunity(opp.id);
      setOpportunities((prev) => prev.filter((o) => o.id !== opp.id));
      toast.success("Opportunity deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddMore = async () => {
    setAdding(true);
    try {
      const added = await addMoreOpportunities(15);
      toast.success(`Added ${added} more opportunities`);
      await load();
    } catch {
      toast.error("Failed to add opportunities");
    } finally {
      setAdding(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  return (
    <AdminLayout pageTitle="Opportunities">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Opportunities</h1>
          <p className="mt-1 text-muted-foreground">{opportunities.length} total · {availableCount} visible to members</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
          </Button>
          <Button size="sm" onClick={handleAddMore} disabled={adding} className="gap-2">
            <Plus size={14} />{adding ? "Adding..." : "Add More"}
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by title or company..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Briefcase size={40} className="mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No opportunities found</p></CardContent></Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-sm font-medium max-w-[220px] truncate">{o.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.company}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{o.type}</Badge></TableCell>
                    <TableCell className="text-sm">{o.applicants}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{relativeTime(o.postedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={o.available} onCheckedChange={() => toggleAvailability(o)} />
                        {o.available ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => handleDelete(o)}>
                        <Trash2 size={14} />
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
    </AdminLayout>
  );
}
