/**
 * Assets Route
 *
 * Unified asset and Doclattice document workspace.
 */

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
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AssetPreviewModal } from "../components/assets/asset-preview-modal";
import { aiApi, assetsApi, nucleoApi } from "../lib/api";

type WorkspaceView = "all" | "assets" | "documents";

export const Route = createFileRoute("/app/assets")({
  component: AssetsPage,
});

function AssetsPage() {
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("all");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentSearch, setDocumentSearch] = useState("");
  const [newDocument, setNewDocument] = useState({ title: "", content: "" });
  const [documentInsights, setDocumentInsights] = useState<{
    summary: string;
    keywords: string[];
    actionItems: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["assets"],
    queryFn: () => assetsApi.list(),
  });

  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["nucleo-documents"],
    queryFn: () => nucleoApi.documents.list({ page: 1, limit: 100 }),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];

          await assetsApi.upload({
            name: file.name,
            type: file.type,
            content: base64Data,
          });

          toast.success("Asset uploaded successfully");
          queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
          console.error("Upload failed", error);
          toast.error(
            `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const generateTagsMutation = useMutation({
    mutationFn: (id: string) => assetsApi.generateTags(id),
    onSuccess: (data, variables) => {
      toast.success("AI tags generated");
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      if (selectedAsset && selectedAsset.id === variables) {
        setSelectedAsset({ ...selectedAsset, tags: data.tags });
      }
    },
    onError: (error) => {
      console.error("Tag generation failed", error);
      toast.error(`Tag generation failed: ${error.message}`);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsPreviewOpen(false);
    },
    onError: (error) => {
      console.error("Delete failed", error);
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: (payload: { title: string; content?: string }) =>
      nucleoApi.documents.create(payload),
    onSuccess: () => {
      toast.success("Document created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-documents"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsDocumentModalOpen(false);
      setNewDocument({ title: "", content: "" });
      setDocumentInsights(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create document");
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.documents.update(id, { status }),
    onSuccess: () => {
      toast.success("Document updated");
      queryClient.invalidateQueries({ queryKey: ["nucleo-documents"] });
    },
    onError: () => {
      toast.error("Failed to update document");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => nucleoApi.documents.delete(id),
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["nucleo-documents"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const analyzeDocumentMutation = useMutation({
    mutationFn: (payload: { title?: string; content?: string }) =>
      aiApi.analyzeDocumentDraft(payload),
    onSuccess: (response) => {
      if (!response.result) {
        toast.error("AI insights unavailable");
        return;
      }
      setDocumentInsights(response.result);
      toast.success("Document insights generated");
    },
    onError: () => {
      toast.error("Failed to analyze document");
    },
  });

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
    setIsPreviewOpen(true);
  };

  const assets = assetsData?.data || [];
  const documents = documentsData?.data || [];

  const taggedAssetsCount = assets.filter(
    (asset: any) => (asset.tags?.length || 0) > 0,
  ).length;
  const publishedDocumentsCount = documents.filter(
    (doc: any) => doc.status === "published",
  ).length;

  const filteredDocuments = useMemo(() => {
    if (!documentSearch.trim()) return documents;
    const searchLower = documentSearch.toLowerCase();
    return documents.filter((doc: any) => {
      const title = String(doc.title || "").toLowerCase();
      const status = String(doc.status || "").toLowerCase();
      return title.includes(searchLower) || status.includes(searchLower);
    });
  }, [documentSearch, documents]);

  const isLoading = isLoadingAssets || isLoadingDocuments;
  if (isLoading) {
    return <Loading text="Loading unified workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Assets + Doclattice
          </h1>
          <p className="text-muted-foreground">
            Digital asset management merged with AI document workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Bot className="h-4 w-4" />}
            onClick={() => setIsDocumentModalOpen(true)}
          >
            New Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            variant="primary"
            leftIcon={
              isUploading ? <Loading className="h-4 w-4" /> : <Upload className="h-4 w-4" />
            }
            onClick={() => fileInputRef.current?.click()}
            loading={isUploading}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Asset"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Total Assets</p>
            <p className="font-bold text-2xl text-foreground">{assets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Tagged Assets</p>
            <p className="font-bold text-2xl text-primary">{taggedAssetsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Published Documents</p>
            <p className="font-bold text-2xl text-success">
              {publishedDocumentsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={workspaceView === "all" ? "primary" : "outline"}
          onClick={() => setWorkspaceView("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={workspaceView === "assets" ? "primary" : "outline"}
          onClick={() => setWorkspaceView("assets")}
        >
          Assets
        </Button>
        <Button
          size="sm"
          variant={workspaceView === "documents" ? "primary" : "outline"}
          onClick={() => setWorkspaceView("documents")}
        >
          Documents
        </Button>
      </div>

      {workspaceView !== "documents" ? (
        assets.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-12 w-12" />}
            title="No assets yet"
            description="Upload files to get started with AI tagging."
            action={{
              label: "Upload Asset",
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset: any) => {
              const mimeType = String(asset.type || asset.mimeType || "");
              const isImage = mimeType.startsWith("image/");

              return (
                <Card
                  key={asset.id}
                  className="group cursor-pointer overflow-hidden border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-md"
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {isImage && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <FileText className="h-16 w-16" />
                      </div>
                    )}

                    {(asset.tags?.length || 0) > 0 ? (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className="h-5 bg-card/90 py-0.5 text-xs shadow-sm backdrop-blur"
                        >
                          <Sparkles className="mr-1 h-3 w-3 text-primary" />
                          {asset.tags.length}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p
                      className="truncate font-medium text-foreground text-sm"
                      title={asset.name}
                    >
                      {asset.name}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs uppercase tracking-wider">
                      {(mimeType.split("/")[1] || mimeType || "file").toUpperCase()}
                      {" • "}
                      {(Number(asset.size || 0) / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {workspaceView !== "assets" ? (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Doclattice Documents</CardTitle>
                <p className="text-muted-foreground text-sm">
                  AI-ready documents, version history, and review lifecycle.
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsDocumentModalOpen(true)}
              >
                New Document
              </Button>
            </div>
            <Input
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
              placeholder="Search documents by title or status..."
            />
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-12 w-12" />}
                title="No documents found"
                description="Create a new document or clear your search."
                action={{
                  label: "Create Document",
                  onClick: () => setIsDocumentModalOpen(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="line-clamp-1 text-base">
                          {doc.title}
                        </CardTitle>
                        <Badge
                          variant={
                            doc.status === "published" ? "success" : "outline"
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Version: {doc.currentVersion || 1}
                      </p>
                      <p className="text-muted-foreground">
                        Updated:{" "}
                        {doc.updatedAt
                          ? new Date(doc.updatedAt).toLocaleDateString()
                          : "-"}
                      </p>
                      <p className="text-muted-foreground">
                        Created:{" "}
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "-"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateDocumentMutation.mutate({
                              id: doc.id,
                              status:
                                doc.status === "published" ? "draft" : "published",
                            })
                          }
                        >
                          {doc.status === "published" ? "Move to Draft" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <AssetPreviewModal
        asset={selectedAsset}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onGenerateTags={(id) => generateTagsMutation.mutate(id)}
        isGeneratingTags={generateTagsMutation.isPending}
        onDelete={(id) => deleteAssetMutation.mutate(id)}
      />

      <FormModal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setDocumentInsights(null);
        }}
        title="Create Doclattice Document"
        submitText="Create Document"
        loading={createDocumentMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const title = newDocument.title.trim();
          if (!title) {
            toast.error("Document title is required");
            return;
          }
          createDocumentMutation.mutate({
            title,
            content: newDocument.content.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-muted-foreground text-sm">
              Run AI draft analysis for summary, keywords, and action items.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4" />}
              loading={analyzeDocumentMutation.isPending}
              onClick={() => {
                const title = newDocument.title.trim();
                const content = newDocument.content.trim();
                if (!title && !content) {
                  toast.error("Add title or content before AI analysis");
                  return;
                }
                analyzeDocumentMutation.mutate({
                  title: title || undefined,
                  content: content || undefined,
                });
              }}
            >
              AI Analyze
            </Button>
          </div>
          {documentInsights ? (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-foreground">
                {documentInsights.summary}
              </p>
              <p className="text-muted-foreground">
                Keywords: {documentInsights.keywords.join(", ")}
              </p>
              <p className="text-muted-foreground">
                Next actions: {documentInsights.actionItems.join(" | ")}
              </p>
            </div>
          ) : null}
          <FormField label="Document Title" required>
            <Input
              value={newDocument.title}
              onChange={(e) =>
                setNewDocument((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Q1 Product Requirements"
              required
            />
          </FormField>
          <FormField label="Initial Content">
            <Textarea
              value={newDocument.content}
              onChange={(e) =>
                setNewDocument((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              placeholder="Add context, notes, or the first draft..."
              rows={6}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
