import { Button, Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  AlertCircle
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/social/posts/calendar")({
  component: CalendarPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: postsData, isError, refetch} = useQuery({
    queryKey: ["social", "posts", "calendar", year, month],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();
      const res = await fetch(
        `${API_BASE}/social/posts?startDate=${startDate}&endDate=${endDate}&limit=100`,
        {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        }
      );
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const calendarPosts = useMemo(() => {
    const data: any[] = (postsData as any)?.data ?? [];
    if (data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        day: new Date(p.scheduledAt ?? p.createdAt).getDate(),
        platform: (p.platform ?? "instagram").toLowerCase(),
        time: new Date(p.scheduledAt ?? p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: p.content?.substring(0, 40) ?? "Post",
      }));
    }
    return [];
  }, [postsData]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-3 w-3 text-pink-500" />;
      case "twitter": return <Twitter className="h-3 w-3 text-sky-500" />;
      case "linkedin": return <Linkedin className="h-3 w-3 text-blue-600" />;
      case "facebook": return <Facebook className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const getPostsForDay = (day: number) => {
    return calendarPosts.filter((post) => post.day === day);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social/posts" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Content Calendar</h2>
            <p className="text-muted-foreground text-sm">Visualize your scheduled posts</p>
          </div>
        </div>
        <Link to="/app/social/posts/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Create Post
          </Button>
        </Link>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const posts = getPostsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();

              return (
                <div
                  key={day}
                  className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors ${
                    selectedDay === day ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  } ${isToday ? "bg-primary/10" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {posts.slice(0, 2).map((post) => (
                      <div key={post.id} className="flex items-center gap-1 text-xs p-1 bg-muted rounded truncate">
                        {getPlatformIcon(post.platform)}
                        <span className="truncate">{post.title}</span>
                      </div>
                    ))}
                    {posts.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{posts.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
