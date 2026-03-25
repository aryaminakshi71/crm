import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Building2,
  Download,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCircle,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { contactsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/crm/contacts/_index")({
  validateSearch: searchSchema,
  component: ContactsPage,
});

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

  const EXPECTED_COLS = ["firstName", "lastName", "email", "phone", "company"];
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
        await contactsApi.create({
          firstName: row.firstName ?? "",
          lastName: row.lastName ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          companyName: row.company ?? "",
          jobTitle: "",
        });
        success++;
      } catch {
        // continue on individual row failure
      }
    }
    setImporting(false);
    setImportResult(success);
    qc.invalidateQueries({ queryKey: ["crm-contacts"] });
    toast.success(`Imported ${success} contact${success !== 1 ? "s" : ""} successfully`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold">Import Contacts from CSV</h3>
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
              id="contacts-csv-input"
            />
            <label
              htmlFor="contacts-csv-input"
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
              Importing {csvRows.length} contacts…
            </div>
          )}

          {importResult !== null && (
            <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600">
              Imported {importResult} contact{importResult !== 1 ? "s" : ""} successfully
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
            {importing ? "Importing…" : `Import ${csvRows.length > 0 ? csvRows.length + " " : ""}Contacts`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContactsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { q: search, page } = useSearch({ from: Route.fullPath });
  const setSearch = (q: string) => navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts", page, search],
    queryFn: () => contactsApi.list({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const CONTACTS_KEY = ["crm-contacts"] as const;

  const createContact = useMutation({
    mutationFn: (payload: typeof newContact) => contactsApi.create(payload),
    onMutate: async (newItem) => {
      await qc.cancelQueries({ queryKey: CONTACTS_KEY });
      const previous = qc.getQueryData([...CONTACTS_KEY, page, search]);
      qc.setQueryData([...CONTACTS_KEY, page, search], (old: any) => ({
        ...old,
        data: [{ ...newItem, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Contact created");
      setIsCreateOpen(false);
      setNewContact({ firstName: "", lastName: "", email: "", phone: "", companyName: "", jobTitle: "" });
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...CONTACTS_KEY, page, search], ctx.previous);
      toast.error(e.message || "Failed to create contact");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CONTACTS_KEY });
      const previous = qc.getQueryData([...CONTACTS_KEY, page, search]);
      qc.setQueryData([...CONTACTS_KEY, page, search], (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((item: any) => item.id !== id),
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Contact deleted");
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...CONTACTS_KEY, page, search], ctx.previous);
      toast.error(e.message || "Failed to delete contact");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });

  const contacts: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleBulkExport = () => {
    const selected = contacts.filter((c: any) => selectedIds.has(c.id));
    const csv = [
      ["Name", "Email", "Phone", "Company"].join(","),
      ...selected.map((c: any) =>
        [
          `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
          c.email ?? "",
          c.phone ?? "",
          c.companyName ?? "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    for (const id of Array.from(selectedIds)) {
      await contactsApi.delete(id);
    }
    qc.invalidateQueries({ queryKey: ["crm-contacts"] });
    setSelectedIds(new Set());
    toast.success(`Deleted ${count} contact(s)`);
  };

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthContacts = contacts.filter((c: any) => {
    const d = c.createdAt ? new Date(c.createdAt) : null;
    return d && d >= thisMonthStart;
  }).length;

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const s = search.toLowerCase();
    return contacts.filter((c: any) =>
      [c.firstName, c.lastName, c.email, c.companyName, c.phone, c.jobTitle]
        .some((v) => String(v ?? "").toLowerCase().includes(s))
    );
  }, [contacts, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c: any) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c: any) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) return (
    <div className="space-y-6">
      <SkeletonTable rows={8} cols={5} />
    </div>
  );

  return (
    <div className="space-y-6">
      {showImport && <CSVImportModal onClose={() => setShowImport(false)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contact?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteContact.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Users className="h-6 w-6" /> Contacts
          </h1>
          <p className="text-muted-foreground text-sm">Manage your customer and prospect contacts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImport(true)}
          >
            Import CSV
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add Contact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Total Contacts" value={contacts.length} icon={<Users className="h-4 w-4" />} trend="all time" color="text-primary" />
        <Metric title="New This Month" value={thisMonthContacts} icon={<UserCircle className="h-4 w-4" />} trend="this month" color="text-emerald-400" />
        <Metric
          title="With Email"
          value={contacts.filter((c: any) => c.email).length}
          icon={<Mail className="h-4 w-4" />}
          trend="have email address"
          color="text-cyan-400"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No contacts found"
              description={search ? "Try adjusting your search." : "Add your first contact to get started."}
              action={<Button onClick={() => setIsCreateOpen(true)}>Add Contact</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {/* Select All header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all contacts"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all</span>
              </div>
              {filtered.map((contact: any) => (
                <div key={contact.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
                      aria-label={`Select ${contact.firstName ?? ""} ${contact.lastName ?? ""}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {String(contact.firstName ?? "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {contact.firstName ?? ""} {contact.lastName ?? ""}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {contact.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </span>
                        )}
                        {contact.companyName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {contact.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {contact.jobTitle && <Badge variant="outline">{contact.jobTitle}</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => setDeleteTarget({ id: contact.id, name: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() })}
                      loading={deleteContact.isPending}
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
        title="Add Contact"
        submitText="Create Contact"
        loading={createContact.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newContact.firstName.trim()) {
            toast.error("First name is required");
            return;
          }
          createContact.mutate(newContact);
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input
                value={newContact.firstName}
                onChange={(e) => setNewContact((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Jane"
                required
              />
            </FormField>
            <FormField label="Last Name" required>
              <Input
                value={newContact.lastName}
                onChange={(e) => setNewContact((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe"
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
              placeholder="jane@company.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newContact.phone}
              onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={newContact.companyName}
              onChange={(e) => setNewContact((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="Acme Corp"
            />
          </FormField>
          <FormField label="Job Title">
            <Input
              value={newContact.jobTitle}
              onChange={(e) => setNewContact((p) => ({ ...p, jobTitle: e.target.value }))}
              placeholder="Product Manager"
            />
          </FormField>
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
            {icon ?? <Users className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
