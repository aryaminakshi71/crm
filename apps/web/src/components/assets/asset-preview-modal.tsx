interface Asset {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType?: string;
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
  onDelete?: (id: string) => void;
}

export function AssetPreviewModal({
  asset,
  isOpen,
  onClose,
  onGenerateTags,
  isGeneratingTags,
  onDelete,
}: AssetPreviewModalProps) {
  if (!asset || !isOpen) return null;

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      onDelete?.(asset.id);
      onClose();
    }
  };

  const isImage =
    (asset.type?.startsWith("image/") ||
      asset.mimeType?.startsWith("image/")) &&
    asset.url;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
            {asset.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: "24px",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flex: 1, minHeight: "400px" }}>
          {/* Preview */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            {isImage ? (
              <img
                src={asset.url}
                alt={asset.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={{ color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                  {asset.type.split("/")[1]?.toUpperCase() || "FILE"}
                </div>
                <p>{asset.name}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div
            style={{
              width: "280px",
              padding: "20px",
              borderLeft: "1px solid #e5e7eb",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Type
              </p>
              <p style={{ fontSize: "14px" }}>{asset.type}</p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Size
              </p>
              <p style={{ fontSize: "14px" }}>
                {Math.round(Number(asset.size) / 1024)} KB
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Tags
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {asset.tags?.length > 0 ? (
                  asset.tags.map((tag: string) => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: "#e5e7eb",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                  >
                    No tags
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete Asset
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
