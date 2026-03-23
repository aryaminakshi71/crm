import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { assetsApi } from "../lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/crm/documents")({
  component: CrmDocumentsPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

function CrmDocumentsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["crm-documents"],
    queryFn: () => assetsApi.list({ page: 1, limit: 100 }),
  });

  const docs = (data?.data as any[]) ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/crm/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload document");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleUpload() {
    const name = window.prompt("Enter document name:");
    if (!name?.trim()) return;
    uploadDocumentMutation.mutate({
      name: name.trim(),
      type: "document",
      url: "",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Failed to load. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">
              CRM
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Documents</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm">
            Contracts, proposals, and files attached to your CRM records.
          </p>
        </div>
        <Button
          leftIcon={<Upload className="h-4 w-4" />}
          variant="outline"
          onClick={handleUpload}
          disabled={uploadDocumentMutation.isPending}
        >
          {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {isLoading ? (
        <Loading text="Loading documents..." />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-primary/40" />}
          title="No documents yet"
          description="Files attached to contacts, leads, and deals will appear here. Use the Assets section to upload files."
        />
      ) : (
        <div className="grid gap-3">
          {docs.map((doc: any) => (
            <Card
              key={doc.id}
              className="border-border/60 hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-muted/50 p-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {doc.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {doc.mimeType} · {formatSize(doc.size ?? 0)}
                  </p>
                </div>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    View
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
