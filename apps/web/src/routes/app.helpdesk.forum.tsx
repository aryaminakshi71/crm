import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/helpdesk/forum")({
  component: ForumPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.companyId) return { "x-organization-id": user.companyId };
    } catch {}
  }
  return {};
}

async function fetchForumCategories() {
  const res = await fetch(`${API_BASE}/v1/helpdesk/forum/categories`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("No forum endpoint");
  return res.json();
}

async function fetchForumThreads() {
  const res = await fetch(`${API_BASE}/v1/helpdesk/forum/threads?trending=true`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("No forum endpoint");
  return res.json();
}

function ForumPage() {
  const { data: categoriesData, error: categoriesError } = useQuery({
    queryKey: ["helpdesk", "forum", "categories"],
    queryFn: fetchForumCategories,
    retry: false,
  });

  const { data: threadsData, error: threadsError } = useQuery({
    queryKey: ["helpdesk", "forum", "threads", "trending"],
    queryFn: fetchForumThreads,
    retry: false,
  });

  const categories: any[] = categoriesData?.data ?? [];
  const threads: any[] = threadsData?.data ?? [];
  const hasData =
    !categoriesError && !threadsError && (categories.length > 0 || threads.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Community Forum</h1>
        <p className="text-muted-foreground">
          Discussion boards, trending threads, and community Q&amp;A.
        </p>
      </div>

      {hasData ? (
        <>
          {categories.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground">Categories</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat: any) => (
                  <Card key={cat.id}>
                    <CardContent className="p-4">
                      <p className="font-medium text-foreground">{cat.name}</p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cat.description}
                        </p>
                      )}
                      {cat.threadCount != null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {cat.threadCount} threads
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {threads.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground">Trending Threads</h2>
              <div className="space-y-3">
                {threads.map((thread: any) => (
                  <Card key={thread.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {thread.title}
                          </p>
                          {thread.category && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {thread.category}
                            </p>
                          )}
                        </div>
                        {thread.replyCount != null && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MessageCircle className="h-3 w-3" />
                            {thread.replyCount}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <EmptyState
            icon={<MessageCircle className="h-12 w-12" />}
            title="Forum coming soon"
            description="The community forum feature is not yet configured. Once enabled, customers can post questions, share tips, and browse trending discussions."
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Planned Forum Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The forum module will include: discussion categories, threaded
                replies, upvoting, tagging, and moderation tools.
              </p>
              <p>
                Community-answered questions can also be promoted to knowledge
                base articles automatically.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
