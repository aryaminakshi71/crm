import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/crm/documents/_index")({
  validateSearch: searchSchema,
  component: DocumentsPage,
});

function getFileIcon(type: string) {
  if (type.includes("pdf") || type.includes("text")) return <FileText className="h-5 w-5 text-red-400" />;
  if (type.includes("image")) return <FileImage className="h-5 w-5 text-blue-400" />;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsPage() {
  const { q: search = "", category: categoryFilter = "all" } = useSearch({ from: "/app/crm/documents/_index" });
  const navigate = useNavigate({ from: "/app/crm/documents" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setCategoryFilter = (v: string) => navigate({ search: (p) => ({ ...p, category: v }) });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-documents"],
    queryFn: () => nucleoApi.documents.list({ page: 1, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  const createDocumentMutation = useMutation({
    mutationFn: (docData: { name: string; category?: string; type?: string }) =>
      nucleoApi.documents.create({ title: docData.name, content: docData.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-documents"] });
      toast.success("Document created successfully");
      setIsUploadOpen(false);
      setUploadName("");
      setUploadCategory("");
    },
    onError: () => toast.error("Failed to create document"),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => nucleoApi.documents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-documents"] });
      toast.success("Document deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const documents: any[] = (data as any)?.data ?? [];

  const categories = Array.from(new Set(documents.map((d: any) => d.category).filter(Boolean)));

  const filtered = useMemo(() => {
    return documents.filter((d: any) => {
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return [d.name, d.category, d.type].some((v) => String(v ?? "").toLowerCase().includes(s));
    });
  }, [documents, search, categoryFilter]);

  const totalSize = documents.reduce((sum: number, d: any) => sum + (d.size || 0), 0);

  if (isLoading) return <Loading text="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FolderOpen className="h-6 w-6" /> Documents
          </h1>
          <p className="text-muted-foreground text-sm">Manage contracts, proposals, and sales collateral.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsUploadOpen(true)}>
          Upload Document
        </Button>
      </div>

      {isUploadOpen && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Document</h3>
            <Input
              placeholder="Document name"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
            <Input
              placeholder="Category (e.g. Contracts, Proposals)"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!uploadName.trim() || createDocumentMutation.isPending}
                onClick={() =>
                  createDocumentMutation.mutate({
                    name: uploadName.trim(),
                    category: uploadCategory.trim() || undefined,
                    type: "application/pdf",
                  })
                }
              >
                {createDocumentMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard title="Total Files" value={documents.length} icon={<File className="h-4 w-4" />} color="text-primary" />
        <MetricCard title="Storage Used" value={formatBytes(totalSize)} icon={<FolderOpen className="h-4 w-4" />} color="text-cyan-400" />
        <MetricCard title="Categories" value={categories.length} icon={<FileText className="h-4 w-4" />} color="text-violet-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-12 w-12" />}
              title="No documents found"
              description={search ? "Try adjusting your search." : "Upload your first document."}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getFileIcon(doc.type ?? "")}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {doc.size != null && (
                          <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                        )}
                        {doc.uploadedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {doc.category && <Badge variant="outline">{doc.category}</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                      onClick={() => {}}
                    >
                      Download
                    </Button>
                    {deleteConfirmId === doc.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteDocumentMutation.isPending}
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        >
                          {deleteDocumentMutation.isPending ? "Deleting..." : "Confirm"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-3.5 w-3.5 text-destructive" />}
                        onClick={() => setDeleteConfirmId(doc.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <Zap className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
