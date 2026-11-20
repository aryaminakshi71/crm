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
import { MessageCircle, Plus, Pin,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/forum")({
  component: ForumPage,
});

function ForumPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", body: "", tags: "" });
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "forums", statusFilter, search],
    queryFn: () =>
      helpdeskApi.forums.list({
        page: 1,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; tags?: string[] }) =>
      helpdeskApi.forums.create(payload),
    onSuccess: () => {
      toast.success("Forum post created");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "forums"] });
      setIsCreateOpen(false);
      setForm({ title: "", body: "", tags: "" });
    },
    onError: () => toast.error("Failed to create forum post"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      helpdeskApi.forums.update(id, { status }),
    onSuccess: () => {
      toast.success("Post updated");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "forums"] });
    },
    onError: () => toast.error("Failed to update post"),
  });

  if (isLoading) return <Loading text="Loading forum..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const posts: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Community Forum</h1>
          <p className="text-muted-foreground">
            Discussion boards, trending threads, and community Q&amp;A.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Post
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {posts.length === 0 ? (
        <>
          <EmptyState
            icon={<MessageCircle className="h-12 w-12" />}
            title="No forum posts yet"
            description="Create the first discussion post to get community conversations started."
            action={<Button onClick={() => setIsCreateOpen(true)}>New Post</Button>}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Forum Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The forum module includes: discussion threads, status tracking
                (open/answered/closed), pinning, tagging, and view counts.
              </p>
              <p>
                Community-answered questions can also be promoted to knowledge
                base articles.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {post.isPinned && (
                        <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                      <p className="font-medium text-foreground">
                        {post.title}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.replies} replies
                      </span>
                      <span>{post.views} views</span>
                      <span>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        post.status === "answered"
                          ? "success"
                          : post.status === "closed"
                            ? "outline"
                            : "primary"
                      }
                      className="text-[10px]"
                    >
                      {post.status}
                    </Badge>
                    <select
                      className="h-7 rounded border border-border bg-card text-[10px] px-1"
                      value={post.status}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: post.id,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Forum Post"
        submitText="Create Post"
        loading={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim() || !form.body.trim()) {
            toast.error("Title and body are required");
            return;
          }
          const tags = form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          createMutation.mutate({
            title: form.title.trim(),
            body: form.body.trim(),
            tags: tags.length > 0 ? tags : undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="How do I integrate the API?"
            />
          </FormField>
          <FormField label="Body" required>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Share your question or start a discussion..."
            />
          </FormField>
          <FormField label="Tags (comma-separated)">
            <Input
              value={form.tags}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="api, integration, help"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
