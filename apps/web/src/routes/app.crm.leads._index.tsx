import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { Pagination } from "@/components/ui/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Building2,
  Download,
  Flame,
  Mail,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { leadsApi } from "@/lib/api";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  status: z.string().optional().default("all"),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/crm/leads/_index")({
  validateSearch: searchSchema,
  component: LeadsPage,
});

const STATUS_COLORS: Record<string, string> = {
  new: "outline",
  contacted: "primary",
  qualified: "success",
  unqualified: "destructive",
  converted: "success",
};


function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 50;

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────

function CSVImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<number | null>(null);

  const EXPECTED_COLS = ["firstName", "lastName", "email", "company", "phone", "source"];
  const headers = csvRows.length > 0 ? Object.keys(csvRows[0]) : EXPECTED_COLS;
  const previewRows = csvRows.slice(0, 5);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        setCsvRows(parseCSV(text));
      } catch {
        toast.error("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    let success = 0;
    for (const row of csvRows) {
      try {
        await leadsApi.create({
          firstName: row.firstName ?? "",
          lastName: row.lastName ?? "",
          email: row.email ?? "",
          companyName: row.company ?? "",
          source: row.source ?? "",
          status: "new",
          jobTitle: "",
        });
        success++;
      } catch {
        // continue on individual row failure
      }
    }
    setImporting(false);
    setImportResult(success);
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
    toast.success(`Imported ${success} lead${success !== 1 ? "s" : ""} successfully`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold">Import Leads from CSV</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Expected columns:{" "}
              <span className="font-mono text-xs">{EXPECTED_COLS.join(", ")}</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="leads-csv-input"
            />
            <label
              htmlFor="leads-csv-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <Upload className="h-6 w-6" />
              <span>Click to upload or drag CSV here</span>
              {fileName && <span className="font-medium text-foreground">{fileName}</span>}
            </label>
          </div>

          {csvRows.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Preview ({Math.min(5, csvRows.length)} of {csvRows.length} rows)
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        {headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-xs text-foreground">
                            {row[h] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Importing {csvRows.length} leads…
            </div>
          )}

          {importResult !== null && (
            <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600">
              Imported {importResult} lead{importResult !== 1 ? "s" : ""} successfully
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleImport}
            disabled={csvRows.length === 0 || importing || importResult !== null}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            {importing ? "Importing…" : `Import ${csvRows.length > 0 ? csvRows.length + " " : ""}Leads`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeadsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { q: search, status: statusFilter, page } = useSearch({ from: Route.fullPath });
  const setSearch = (q: string) => navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
  const setStatusFilter = (status: string) => navigate({ search: (prev) => ({ ...prev, status, page: 1 }) });
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newLead, setNewLead] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    source: "",
    status: "new",
    jobTitle: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-leads", statusFilter, page],
    queryFn: () =>
      leadsApi.list({
        page,
        limit: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const LEADS_KEY = ["crm-leads"] as const;

  const createLead = useMutation({
    mutationFn: (payload: typeof newLead) => leadsApi.create(payload),
    onMutate: async (newItem) => {
      await qc.cancelQueries({ queryKey: LEADS_KEY });
      const previous = qc.getQueryData([...LEADS_KEY, statusFilter, page]);
      qc.setQueryData([...LEADS_KEY, statusFilter, page], (old: any) => ({
        ...old,
        data: [{ ...newItem, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Lead created");
      setIsCreateOpen(false);
      setNewLead({ firstName: "", lastName: "", email: "", companyName: "", source: "", status: "new", jobTitle: "" });
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...LEADS_KEY, statusFilter, page], ctx.previous);
      toast.error(e.message || "Failed to create lead");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: LEADS_KEY });
      const previous = qc.getQueryData([...LEADS_KEY, statusFilter, page]);
      qc.setQueryData([...LEADS_KEY, statusFilter, page], (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((item: any) => item.id !== id),
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Lead deleted");
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...LEADS_KEY, statusFilter, page], ctx.previous);
      toast.error(e.message || "Failed to delete lead");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });

  const leads: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthLeads = leads.filter((l: any) => {
    const d = l.createdAt ? new Date(l.createdAt) : null;
    return d && d >= thisMonthStart;
  }).length;
  const hotLeads = leads.filter((l: any) => (l.score ?? 0) >= 80 || l.status === "qualified").length;

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const s = search.toLowerCase();
    return leads.filter((l: any) =>
      [l.firstName, l.lastName, l.email, l.companyName, l.source, l.status]
        .some((v) => String(v ?? "").toLowerCase().includes(s))
    );
  }, [leads, search]);

  const allSelected = filtered.length > 0 && filtered.every((l: any) => selectedIds.has(l.id));
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(filtered.map((l: any) => l.id)));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function handleBulkExport() {
    const selected = filtered.filter((l: any) => selectedIds.has(l.id));
    const headers = ["Name", "Email", "Company", "Status", "Score", "Source"];
    const rows = selected.map((l: any) => [
      `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim(),
      l.email ?? "",
      l.companyName ?? "",
      l.status ?? "",
      String(l.score ?? ""),
      l.source ?? "",
    ]);
    exportToCsv("leads.csv", headers, rows);
    toast.success(`Exported ${selected.length} lead${selected.length !== 1 ? "s" : ""}`);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;
    for (const id of ids) {
      try {
        await leadsApi.delete(id);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    qc.invalidateQueries({ queryKey: LEADS_KEY });
    setSelectedIds(new Set());
    if (successCount > 0) toast.success(`Deleted ${successCount} lead${successCount !== 1 ? "s" : ""}`);
    if (errorCount > 0) toast.error(`Failed to delete ${errorCount} lead${errorCount !== 1 ? "s" : ""}`);
  }

  function handleExport() {
    const headers = ["Name", "Email", "Company", "Status", "Score", "Source", "Created Date"];
    const rows = filtered.map((l: any) => [
      `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim(),
      l.email ?? "",
      l.companyName ?? "",
      l.status ?? "",
      String(l.score ?? ""),
      l.source ?? "",
      l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "",
    ]);
    exportToCsv("leads.csv", headers, rows);
  }

  if (isLoading) return <Loading text="Loading leads..." />;

  return (
    <div className="space-y-6">
      {showImport && <CSVImportModal onClose={() => setShowImport(false)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <TrendingUp className="h-6 w-6" /> Leads
          </h1>
          <p className="text-muted-foreground text-sm">Track and qualify inbound and outbound leads.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImport(true)}
          >
            Import CSV
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Total Leads" value={leads.length} icon={<UserPlus className="h-4 w-4" />} trend="all leads" color="text-primary" />
        <Metric title="Hot Leads" value={hotLeads} icon={<Flame className="h-4 w-4" />} trend="qualified or high score" color="text-orange-400" />
        <Metric title="New This Month" value={thisMonthLeads} icon={<Star className="h-4 w-4" />} trend="this month" color="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Unqualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" />Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-12 w-12" />}
              title="No leads found"
              description={search ? "Try adjusting your search." : "Add your first lead to start the funnel."}
              action={<Button onClick={() => setIsCreateOpen(true)}>Add Lead</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all leads"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all</span>
              </div>
              {filtered.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
                      aria-label={`Select lead ${lead.firstName ?? ""} ${lead.lastName ?? ""}`}
                    />
                    <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                      <span className="text-orange-400 font-semibold text-sm">
                        {String(lead.firstName ?? "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {lead.firstName ?? ""} {lead.lastName ?? ""}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {lead.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </span>
                        )}
                        {lead.companyName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {lead.companyName}
                          </span>
                        )}
                        {lead.source && (
                          <span className="text-xs text-muted-foreground">Source: {lead.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {lead.score != null && (
                      <Badge variant="outline" className="text-xs">
                        Score: {lead.score}
                      </Badge>
                    )}
                    <Badge variant={(STATUS_COLORS[lead.status] ?? "outline") as any}>
                      {lead.status ?? "new"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => deleteLead.mutate(lead.id)}
                      loading={deleteLead.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Lead"
        submitText="Create Lead"
        loading={createLead.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLead.firstName.trim()) {
            toast.error("First name is required");
            return;
          }
          createLead.mutate(newLead);
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input
                value={newLead.firstName}
                onChange={(e) => setNewLead((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="John"
                required
              />
            </FormField>
            <FormField label="Last Name">
              <Input
                value={newLead.lastName}
                onChange={(e) => setNewLead((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Smith"
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
              placeholder="john@example.com"
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={newLead.companyName}
              onChange={(e) => setNewLead((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="Acme Corp"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newLead.source}
                onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))}
              >
                <option value="">Unknown</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_email">Cold Email</option>
                <option value="event">Event</option>
                <option value="social">Social Media</option>
                <option value="ad">Paid Ad</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newLead.status}
                onChange={(e) => setNewLead((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
              </select>
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <TrendingUp className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
