import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@crm/ui";
import { motion } from "framer-motion";
import { Copy, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  tags: string[];
  createdAt: string;
}

interface AssetPreviewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateTags?: (id: string) => void;
  isGeneratingTags?: boolean;
}

export function AssetPreviewModal({
  asset,
  isOpen,
  onClose,
  onGenerateTags,
  isGeneratingTags,
}: AssetPreviewModalProps) {
  if (!asset) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(asset.url);
    toast.success("Asset URL copied to clipboard");
  };

  const isImage = asset.type.startsWith("image/");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-4xl overflow-hidden border-border/20 bg-card/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="flex h-[600px] flex-col md:flex-row">
          {/* Preview Area */}
          <div className="group relative flex flex-1 items-center justify-center bg-foreground p-8">
            <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => window.open(asset.url, "_blank")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            {isImage ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={asset.url}
                alt={asset.name}
                className="max-h-full max-w-full rounded-md object-contain shadow-lg"
              />
            ) : (
              <div className="text-center text-background">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-xl bg-card/10">
                  <span className="font-bold text-4xl text-background/50">
                    {asset.type.split("/")[1]?.toUpperCase() || "FILE"}
                  </span>
                </div>
                <p className="font-medium text-lg">{asset.name}</p>
                <p className="text-muted-foreground text-sm">
                  {(asset.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="flex w-full flex-col border-border border-l bg-card p-6 md:w-80">
            <DialogHeader className="mb-6">
              <DialogTitle
                className="truncate pr-8 font-bold text-xl"
                title={asset.name}
              >
                {asset.name}
              </DialogTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                Added {new Date(asset.createdAt).toLocaleDateString()}
              </p>
            </DialogHeader>

            <div className="flex-1 space-y-6 overflow-y-auto">
              {/* Tags Section */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm">Tags</h3>
                  {onGenerateTags && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateTags(asset.id)}
                      disabled={isGeneratingTags}
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Sparkles className="h-3 w-3 text-primary" />
                      {isGeneratingTags ? "Analyzing..." : "AI Tag"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.length > 0 ? (
                    asset.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-md px-2 py-1"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No tags yet
                    </p>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-foreground text-xs uppercase">
                    Type
                  </label>
                  <p
                    className="truncate font-medium text-foreground text-sm"
                    title={asset.type}
                  >
                    {asset.type}
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground text-xs uppercase">
                    Size
                  </label>
                  <p className="font-medium text-foreground text-sm">
                    {(asset.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex gap-3 border-border border-t pt-6">
              <Button
                onClick={handleShare}
                className="flex-1 gap-2"
                variant="default"
              >
                <Copy className="h-4 w-4" />
                Share Asset
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
