/**
 * Assets Route
 *
 * Digital asset management with AI tagging.
 */

import { Badge, Button, Card, EmptyState, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Image as ImageIcon, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AssetPreviewModal } from "../components/assets/asset-preview-modal";
import { assetsApi } from "../lib/api";

export const Route = createFileRoute("/app/assets")({
  component: AssetsPage,
});

function AssetsPage() {
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => assetsApi.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      // simulate upload
      const types = ["image/jpeg", "image/png", "application/pdf"];
      const names = [
        "project-brief.pdf",
        "design-mockup.png",
        "meeting-notes.pdf",
        "site-photo.jpg",
      ];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];

      return assetsApi.create({
        name: randomName,
        type: randomType,
        size: Math.floor(Math.random() * 5000000),
      });
    },
    onSuccess: () => {
      toast.success("Asset uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error) => {
      console.error("Upload failed", error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const generateTagsMutation = useMutation({
    mutationFn: (id: string) => assetsApi.generateTags(id),
    onSuccess: (data, variables) => {
      toast.success("AI Tags generated!");
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      // Update selected asset if open
      if (selectedAsset && selectedAsset.id === variables) {
        setSelectedAsset({ ...selectedAsset, tags: data.tags });
      }
    },
    onError: (error) => {
      console.error("Tag generation failed", error);
      toast.error(`Tag generation failed: ${error.message}`);
    },
  });

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
    setIsPreviewOpen(true);
  };

  const assets = data?.items || [];

  if (isLoading) {
    return <Loading text="Loading assets..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Assets</h1>
          <p className="text-muted-foreground">
            Manage files and documents with AI insights
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => uploadMutation.mutate()}
          loading={uploadMutation.isPending}
        >
          Upload Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-12 w-12" />}
          title="No assets yet"
          description="Upload files to get started with AI tagging."
          action={{
            label: "Upload Mock Asset",
            onClick: () => uploadMutation.mutate(),
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset: any) => (
            <Card
              key={asset.id}
              className="group cursor-pointer overflow-hidden border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-md"
              onClick={() => handleAssetClick(asset)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {asset.type.startsWith("image/") ? (
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

                {asset.tags.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="h-5 bg-card/90 py-0.5 text-xs shadow-sm backdrop-blur"
                    >
                      <Sparkles className="mr-1 h-3 w-3 text-primary" />
                      {asset.tags.length}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p
                  className="truncate font-medium text-foreground text-sm"
                  title={asset.name}
                >
                  {asset.name}
                </p>
                <p className="mt-1 text-muted-foreground text-xs uppercase tracking-wider">
                  {asset.type.split("/")[1]} • {(asset.size / 1024).toFixed(0)}{" "}
                  KB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AssetPreviewModal
        asset={selectedAsset}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onGenerateTags={(id) => generateTagsMutation.mutate(id)}
        isGeneratingTags={generateTagsMutation.isPending}
      />
    </div>
  );
}
