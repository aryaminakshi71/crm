import { Button } from "@crm/ui";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  File,
  FileCheck,
  Clock,
  Users,
  Calendar,
  ChevronRight,
  XCircle,
  CheckCircle2,
  PenTool,
  Send,
  AlertCircle
} from "lucide-react";
import { hrmApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/documents")({
  validateSearch: z.object({
    q: z.string().optional().default(""),
    type: z.string().optional().default(""),
    department: z.string().optional().default(""),
  }),
  component: DocumentManagement,
});

const categories = ["All Categories", "Policies", "Templates", "Contracts", "Benefits", "Onboarding"];
const departments = ["All Departments", "All", "HR", "Legal", "Engineering", "Sales", "Finance"];
const fileTypes = ["All Types", "PDF", "DOCX", "XLSX"];

function DocumentManagement() {
  const { q, type, department } = useSearch({ from: Route.fullPath });
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();

  const setQ = (v: string) => navigate({ search: (prev: any) => ({ ...prev, q: v }) });
  const setType = (v: string) => navigate({ search: (prev: any) => ({ ...prev, type: v }) });
  const setDepartment = (v: string) => navigate({ search: (prev: any) => ({ ...prev, department: v }) });

  const [viewMode, setViewMode] = useState<"documents" | "signatures">("documents");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<{ name: string; category: string; department: string } | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const documentsQuery = useQuery({
    queryKey: ["hrm", "documents", q, type, department],
    queryFn: async () => {
      const res = await fetch(`/api/hrm/documents?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&department=${encodeURIComponent(department)}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    placeholderData: (prev) => prev,
    retry: false,
  });

  const signaturesQuery = useQuery({
    queryKey: ["hrm", "document-signatures"],
    queryFn: async () => {
      const res = await fetch(`/api/hrm/document-signatures`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch signatures");
      return res.json();
    },
    placeholderData: (prev) => prev,
    retry: false,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (payload: { name: string; category: string; department: string }) => {
      const res = await fetch("/api/hrm/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to upload document");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      qc.invalidateQueries({ queryKey: ["hrm", "documents"] });
      setShowUploadModal(false);
      setUploadFile(null);
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hrm/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["hrm", "documents"] });
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  // ── Data ────────────────────────────────────────────────────────────────────
  const allDocuments: any[] = documentsQuery.data?.data ?? [];
  const pendingSignatures: any[] = signaturesQuery.data?.data ?? [];

  const filteredDocuments = allDocuments.filter((doc: any) => {
    const matchesSearch = !q || doc.name.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || doc.category === categoryFilter;
    const matchesType = !type || doc.type === type;
    const matchesDept = !department || doc.department === department;
    return matchesSearch && matchesCategory && matchesType && matchesDept;
  });

  const pendingSigsCount = pendingSignatures.filter((s: any) => s.status === "Pending" || s.status === "Sent").length;
  const completedSigsCount = pendingSignatures.filter((s: any) => s.status === "Completed").length;

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return { icon: FileText, color: "text-red-500", bgColor: "bg-red-500/10" };
      case "DOCX":
        return { icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10" };
      case "XLSX":
        return { icon: FileText, color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
      default:
        return { icon: File, color: "text-gray-500", bgColor: "bg-gray-500/10" };
    }
  };

  const isLoading = documentsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Document Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage HR documents, templates, and electronic signatures
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-xl font-bold text-foreground">{allDocuments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Signatures</p>
              <p className="text-xl font-bold text-foreground">{pendingSigsCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-foreground">{completedSigsCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-xl font-bold text-foreground">{categories.length - 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        {[
          { id: "documents", label: "Documents", icon: FileText },
          { id: "signatures", label: "Signature Requests", icon: PenTool, badge: pendingSigsCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge ? (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Documents View */}
      {viewMode === "documents" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={type || "All Types"}
              onChange={(e) => setType(e.target.value === "All Types" ? "" : e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {fileTypes.map((ft) => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
            <select
              value={department || "All Departments"}
              onChange={(e) => setDepartment(e.target.value === "All Departments" ? "" : e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-muted" />
                  </div>
                  <div className="h-4 bg-muted rounded mb-1 w-3/4" />
                  <div className="h-3 bg-muted rounded mb-3 w-1/2" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Documents Grid */}
          {!isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((doc: any) => {
                const fileIcon = getFileIcon(doc.type);
                return (
                  <div key={doc.id} className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileIcon.bgColor}`}>
                        <fileIcon.icon className={`h-5 w-5 ${fileIcon.color}`} />
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium text-foreground text-sm mb-1 truncate">{doc.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{doc.type} · {doc.size}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {doc.category}
                      </span>
                      {doc.signings > 0 && (
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                          {doc.signings} signings
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div className="text-[10px] text-muted-foreground">
                        <p>Uploaded {doc.uploadedAt}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        doc.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : doc.status === "Pending Review"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-gray-500/10 text-gray-500"
                      }`}>
                        {doc.status === "Active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                        <Eye className="h-3 w-3 inline mr-1" />
                        View
                      </button>
                      <button className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                        <Download className="h-3 w-3 inline mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Signatures View */}
      {viewMode === "signatures" && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Signature Requests</h3>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4" />
              Send for Signature
            </button>
          </div>

          {signaturesQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-4 animate-pulse">
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSignatures.map((sig: any) => (
                <div key={sig.id} className="rounded-lg border border-border/60 bg-card">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        sig.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : sig.status === "Sent"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}>
                        <PenTool className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sig.document}</p>
                        <p className="text-xs text-muted-foreground">Sent to: {sig.sentTo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="text-sm font-medium text-foreground">{sig.sentAt}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Due</p>
                        <p className="text-sm font-medium text-foreground">{sig.dueDate}</p>
                      </div>
                      {sig.totalCount && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="text-sm font-medium text-foreground">{sig.completedCount}/{sig.totalCount}</p>
                        </div>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        sig.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : sig.status === "Sent"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {sig.status === "Completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {sig.status === "Sent" && <Send className="h-3 w-3 mr-1" />}
                        {sig.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                        {sig.status}
                      </span>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {sig.totalCount && (
                    <div className="px-4 pb-4">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(sig.completedCount / sig.totalCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && viewMode === "documents" && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No documents found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Document Name</label>
                <input
                  type="text"
                  placeholder="e.g. Employee Handbook Q1 2027"
                  value={uploadFile?.name ?? ""}
                  onChange={(e) => setUploadFile((prev) => ({ ...prev!, name: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  value={uploadFile?.category ?? ""}
                  onChange={(e) => setUploadFile((prev) => ({ ...prev!, category: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.slice(1).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                <select
                  value={uploadFile?.department ?? ""}
                  onChange={(e) => setUploadFile((prev) => ({ ...prev!, department: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select department...</option>
                  {departments.slice(1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border-2 border-dashed border-border/60 p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX up to 50MB</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!uploadFile?.name) {
                    toast.error("Please enter a document name");
                    return;
                  }
                  uploadMutation.mutate(uploadFile);
                }}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
