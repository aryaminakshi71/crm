import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  Hash,
  LayoutList,
  Mail,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Phone,
  FileText,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "@/lib/api";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const callVolumeData = [
  { day: "Mon", inbound: 42, outbound: 28 },
  { day: "Tue", inbound: 58, outbound: 34 },
  { day: "Wed", inbound: 51, outbound: 41 },
  { day: "Thu", inbound: 67, outbound: 52 },
  { day: "Fri", inbound: 89, outbound: 63 },
  { day: "Sat", inbound: 23, outbound: 15 },
  { day: "Sun", inbound: 18, outbound: 12 },
];

const channelData = [
  { name: "Voice", value: 45, color: "#3b82f6" },
  { name: "SMS", value: 30, color: "#22c55e" },
  { name: "Chat", value: 20, color: "#f59e0b" },
  { name: "Video", value: 5, color: "#8b5cf6" },
];

export const Route = createFileRoute("/app/communications/_index")({
  component: CommunicationsIndexPage,
});

// ── Email Composer ─────────────────────────────────────────────────────────────

interface EmailComposerProps {
  onClose: () => void;
}

function EmailComposer({ onClose }: EmailComposerProps) {
  const [toInput, setToInput] = useState("");
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [discardOpen, setDiscardOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent =
    toEmails.length > 0 ||
    toInput.trim() !== "" ||
    subject.trim() !== "" ||
    body.trim() !== "" ||
    attachments.length > 0;

  const sendMut = useMutation({
    mutationFn: (draft: boolean) =>
      communicationsApi.email.send({
        to: toEmails,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject,
        body,
        attachments: attachments.map((f) => f.name),
        draft,
      }),
    onSuccess: (_, draft) => {
      toast.success(draft ? "Draft saved" : "Email sent");
      onClose();
    },
    onError: (_, draft) => toast.error(draft ? "Failed to save draft" : "Failed to send email"),
  });

  function handleToKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && toInput.trim()) {
      e.preventDefault();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toInput.trim())) {
        setToEmails((prev) => [...prev, toInput.trim()]);
        setToInput("");
      } else {
        toast.error("Invalid email address");
      }
    }
    if (e.key === "Backspace" && toInput === "" && toEmails.length > 0) {
      setToEmails((prev) => prev.slice(0, -1));
    }
  }

  function handleCcKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && ccInput.trim()) {
      e.preventDefault();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccInput.trim())) {
        setCcEmails((prev) => [...prev, ccInput.trim()]);
        setCcInput("");
      } else {
        toast.error("Invalid email address");
      }
    }
    if (e.key === "Backspace" && ccInput === "" && ccEmails.length > 0) {
      setCcEmails((prev) => prev.slice(0, -1));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  }

  function handleDiscard() {
    if (hasContent) {
      setDiscardOpen(true);
    } else {
      onClose();
    }
  }

  const isBusy = sendMut.isPending;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleDiscard}
      />
      {/* Slide-over panel from bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-0">
        <div className="w-full max-w-3xl rounded-t-2xl border border-border bg-card shadow-2xl flex flex-col"
          style={{ maxHeight: "88vh" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Compose Email
            </h2>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-0 overflow-y-auto flex-1">
            {/* To */}
            <div className="flex items-start gap-2 border-b border-border/40 px-5 py-3">
              <span className="text-sm text-muted-foreground w-14 shrink-0 pt-1.5">To</span>
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-h-[32px]">
                {toEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setToEmails((prev) => prev.filter((e) => e !== email))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={toEmails.length === 0 ? "recipient@example.com, press Enter" : "Add more..."}
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={handleToKeyDown}
                  onBlur={() => {
                    if (toInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toInput.trim())) {
                      setToEmails((prev) => [...prev, toInput.trim()]);
                      setToInput("");
                    }
                  }}
                />
              </div>
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cc
                </button>
              )}
            </div>

            {/* Cc (collapsible) */}
            {showCc && (
              <div className="flex items-start gap-2 border-b border-border/40 px-5 py-3">
                <span className="text-sm text-muted-foreground w-14 shrink-0 pt-1.5">Cc</span>
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-h-[32px]">
                  {ccEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => setCcEmails((prev) => prev.filter((e) => e !== email))}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="cc@example.com, press Enter"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    onBlur={() => {
                      if (ccInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccInput.trim())) {
                        setCcEmails((prev) => [...prev, ccInput.trim()]);
                        setCcInput("");
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCc(false); setCcEmails([]); setCcInput(""); }}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
              <span className="text-sm text-muted-foreground w-14 shrink-0">Subject</span>
              <input
                type="text"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="px-5 py-3 flex-1">
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Write your message..."
                minHeight="220px"
                className="border-none shadow-none"
              />
            </div>

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <span
                    key={`${file.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleDiscard}
                disabled={isBusy}
              >
                Discard
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => sendMut.mutate(true)}
                disabled={isBusy || toEmails.length === 0}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => sendMut.mutate(false)}
                disabled={isBusy || toEmails.length === 0 || !subject.trim()}
              >
                <Mail className="h-3.5 w-3.5 mr-1" />
                {isBusy ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Discard confirm dialog */}
      <ConfirmDialog
        open={discardOpen}
        title="Discard email?"
        description="Your draft will not be saved. This action cannot be undone."
        confirmLabel="Discard"
        variant="danger"
        onConfirm={() => { setDiscardOpen(false); onClose(); }}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

function CommunicationsIndexPage() {
  const [composerOpen, setComposerOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "summary"],
    queryFn: () => communicationsApi.summary(),
  });

  const summary = data ?? {
    conversations: 0,
    messages: 0,
    phoneNumbers: 0,
    queues: 0,
    campaigns: 0,
    templates: 0,
    bots: 0,
  };

  const tiles = [
    {
      label: "Live Chat",
      description: "Manage real-time conversations",
      icon: MessageCircle,
      count: summary.conversations,
      href: "/app/communications/chat",
      color: "text-cyan-400",
    },
    {
      label: "SMS Campaigns",
      description: "Outbound SMS messaging",
      icon: MessageSquare,
      count: summary.campaigns,
      href: "/app/communications/sms",
      color: "text-green-400",
    },
    {
      label: "Templates",
      description: "Reusable message templates",
      icon: FileText,
      count: summary.templates,
      href: "/app/communications/templates",
      color: "text-purple-400",
    },
    {
      label: "Phone Numbers",
      description: "Manage provisioned numbers",
      icon: Phone,
      count: summary.phoneNumbers,
      href: "/app/communications/numbers",
      color: "text-blue-400",
    },
    {
      label: "Queues",
      description: "Inbound routing queues",
      icon: LayoutList,
      count: summary.queues,
      href: "/app/communications/queue",
      color: "text-orange-400",
    },
    {
      label: "Chatbots",
      description: "AI-powered bots",
      icon: Bot,
      count: summary.bots,
      href: "/app/communications/chatbot",
      color: "text-pink-400",
    },
  ];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Communications</h1>
          <p className="text-muted-foreground mt-1">
            Unified inbox for chat, SMS, voice and AI-powered bots.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setComposerOpen(true)}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          Compose Email
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Call Volume (Last 7 Days)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolumeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Bar dataKey="inbound" name="Inbound" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="outbound" name="Outbound" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Channel Distribution</h3>
            <div className="h-[200px] flex items-center gap-4">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {channelData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </span>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.label} to={tile.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tile.label}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${tile.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tile.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tile.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Email Composer */}
      {composerOpen && <EmailComposer onClose={() => setComposerOpen(false)} />}
    </div>
  );
}
