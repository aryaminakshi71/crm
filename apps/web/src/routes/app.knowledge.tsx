import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/knowledge")({
  component: KnowledgePage,
});

function KnowledgePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-documents"],
    queryFn: () => nucleoApi.documents.list({ page: 1, limit: 50 }),
  });

  const createDocument = useMutation({
    mutationFn: ({ title, content }: { title: string; content?: string }) =>
      nucleoApi.documents.create({ title, content }),
    onSuccess: () => {
      toast.success("Document created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-documents"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create document"),
  });

  const docs = data?.data || [];

  const onCreate = () => {
    const title = window.prompt("Document title");
    if (!title || !title.trim()) return;
    const content = window.prompt("Initial content (optional)") || "";
    createDocument.mutate({ title: title.trim(), content });
  };

  if (isLoading) return <Loading text="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Knowledge</h1>
          <p className="text-muted-foreground">Shared document intelligence in one workspace.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
          loading={createDocument.isPending}
        >
          New Document
        </Button>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No documents yet"
          description="Create your first knowledge document in Nucleo One."
          action={{ label: "Create Document", onClick: onCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc: any) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-base">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-muted-foreground">Status: {doc.status}</p>
                <p className="text-muted-foreground">Version: {doc.currentVersion}</p>
                <p className="text-muted-foreground">
                  Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
