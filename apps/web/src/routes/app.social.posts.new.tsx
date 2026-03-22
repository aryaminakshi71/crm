import { Button, Card, CardContent, Input, Textarea } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Image,
  Video,
  Calendar,
  Hash,
  Send,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/social/posts/new")({
  component: NewPostPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "text-sky-500" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
];

function NewPostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [scheduledTime, setScheduledTime] = useState("");

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const createPost = useMutation({
    mutationFn: async (payload: {
      content: string;
      platforms: string[];
      scheduledAt?: string;
    }) => {
      const res = await fetch(`${API_BASE}/social/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "posts"] });
      toast.success(schedule === "now" ? "Post published!" : "Post scheduled!");
      navigate({ to: "/app/social/posts" });
    },
    onError: () => {
      toast.error("Failed to create post. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    createPost.mutate({
      content,
      platforms: selectedPlatforms,
      scheduledAt: schedule === "later" && scheduledTime ? scheduledTime : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social/posts" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Create Post</h2>
            <p className="text-muted-foreground text-sm">Create and schedule social media posts</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Content */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<Image className="h-4 w-4" />}>
                  Add Image
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Video className="h-4 w-4" />}>
                  Add Video
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Hash className="h-4 w-4" />}>
                  Add Hashtags
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Schedule
              </h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === "now"}
                    onChange={() => setSchedule("now")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Publish now</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === "later"}
                    onChange={() => setSchedule("later")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Schedule for later</span>
                </label>
              </div>
              {schedule === "later" && (
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Platforms</h3>
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${platform.color}`} />
                        <span className="text-sm font-medium">{platform.name}</span>
                        {isSelected && (
                          <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {content.length}/2200 characters
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                leftIcon={schedule === "now" ? <Send className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                onClick={handleSubmit}
                disabled={createPost.isPending}
              >
                {createPost.isPending
                  ? "Saving..."
                  : schedule === "now"
                  ? "Publish Now"
                  : "Schedule Post"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
