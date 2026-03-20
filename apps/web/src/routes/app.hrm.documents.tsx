import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/documents")({
  component: DocumentManagement,
});

const documents = [
  { id: "1", name: "Employee Handbook 2026", type: "PDF", category: "Policies", size: "2.4 MB", uploadedAt: "Jan 15, 2026", uploadedBy: "Amanda White", status: "Active", signings: 0 },
  { id: "2", name: "NDA - Standard Template", type: "DOCX", category: "Templates", size: "156 KB", uploadedAt: "Jan 10, 2026", uploadedBy: "Amanda White", status: "Active", signings: 45 },
  { id: "3", name: "Offer Letter Template", type: "DOCX", category: "Templates", size: "124 KB", uploadedAt: "Jan 10, 2026", uploadedBy: "Amanda White", status: "Active", signings: 28 },
  { id: "4", name: "PTO Policy Update", type: "PDF", category: "Policies", size: "890 KB", uploadedAt: "Feb 1, 2026", uploadedBy: "Amanda White", status: "Pending Review", signings: 0 },
  { id: "5", name: "Benefits Overview 2026", type: "PDF", category: "Benefits", size: "3.2 MB", uploadedAt: "Jan 5, 2026", uploadedBy: "Amanda White", status: "Active", signings: 0 },
  { id: "6", name: "Remote Work Policy", type: "PDF", category: "Policies", size: "1.1 MB", uploadedAt: "Mar 1, 2026", uploadedBy: "Tom Wilson", status: "Active", signings: 0 },
  { id: "7", name: "Performance Review Form", type: "DOCX", category: "Templates", size: "98 KB", uploadedAt: "Feb 15, 2026", uploadedBy: "Amanda White", status: "Active", signings: 0 },
  { id: "8", name: "Onboarding Checklist", type: "XLSX", category: "Templates", size: "45 KB", uploadedAt: "Jan 20, 2026", uploadedBy: "Amanda White", status: "Active", signings: 0 },
  { id: "9", name: "Employment Contract Template", type: "DOCX", category: "Contracts", size: "178 KB", uploadedAt: "Jan 10, 2026", uploadedBy: "Amanda White", status: "Active", signings: 67 },
  { id: "10", name: "Confidentiality Agreement", type: "PDF", category: "Contracts", size: "234 KB", uploadedAt: "Jan 10, 2026", uploadedBy: "Amanda White", status: "Active", signings: 112 },
];

const pendingSignatures = [
  { id: "1", document: "Sarah Chen - Offer Letter", sentTo: "sarah.chen@email.com", sentAt: "Mar 18, 2026", status: "Pending", dueDate: "Mar 25, 2026" },
  { id: "2", document: "Marcus Johnson - NDA", sentTo: "marcus.johnson@email.com", sentAt: "Mar 17, 2026", status: "Pending", dueDate: "Mar 24, 2026" },
  { id: "3", document: "Employee Handbook Acknowledgment", sentTo: "all-employees@nucleo.one", sentAt: "Mar 15, 2026", status: "Sent", dueDate: "Mar 31, 2026", completedCount: 180, totalCount: 248 },
  { id: "4", document: "Benefits Enrollment Form", sentTo: "david.kim@email.com", sentAt: "Mar 10, 2026", status: "Completed", completedAt: "Mar 12, 2026" },
];

const categories = ["All Categories", "Policies", "Templates", "Contracts", "Benefits", "Onboarding"];
const typeIcons: Record<string, React.ElementType> = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileText,
};

function DocumentManagement() {
  const [viewMode, setViewMode] = useState<"documents" | "signatures">("documents");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const pendingSigsCount = pendingSignatures.filter((s) => s.status === "Pending" || s.status === "Sent").length;
  const completedSigsCount = pendingSignatures.filter((s) => s.status === "Completed").length;

  const getFileIcon = (type: string) => {
    switch (type) {
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
              <p className="text-xl font-bold text-foreground">{documents.length}</p>
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
            {tab.badge && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents View */}
      {viewMode === "documents" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((doc) => {
              const fileIcon = getFileIcon(doc.type);
              return (
                <div key={doc.id} className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileIcon.bgColor}`}>
                      <fileIcon.icon className={`h-5 w-5 ${fileIcon.color}`} />
                    </div>
                    <div className="relative">
                      <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
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

          <div className="space-y-4">
            {pendingSignatures.map((sig) => (
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
        </>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && viewMode === "documents" && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No documents found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
