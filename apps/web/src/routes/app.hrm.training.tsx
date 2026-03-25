import { Button } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Code,
  Download,
  FileText,
  GraduationCap,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Users,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/training")({
  component: TrainingPrograms,
});

// Mock data removed – training programs now fetched from API via nucleoApi.hrm.training.programs.list()

function _unused() {
  return [
  {
    id: "1",
    title: "React Fundamentals",
    description: "Master React from the ground up. Learn components, hooks, state management, and modern React patterns.",
    type: "Technical",
    format: "Video",
    duration: "8 hours",
    modules: 12,
    enrolled: 86,
    completed: 72,
    rating: 4.8,
    status: "Active",
    nextSession: "Mar 25, 2026",
    instructor: "Sarah Chen",
    icon: Code,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "2",
    title: "Leadership Essentials",
    description: "Develop critical leadership skills including communication, delegation, and team motivation.",
    type: "Leadership",
    format: "Workshop",
    duration: "4 hours",
    modules: 6,
    enrolled: 45,
    completed: 38,
    rating: 4.6,
    status: "Active",
    nextSession: "Mar 28, 2026",
    instructor: "Jennifer Walsh",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "3",
    title: "Data Privacy & Compliance",
    description: "Annual compliance training covering GDPR, CCPA, and company data handling policies.",
    type: "Compliance",
    format: "Document",
    duration: "2 hours",
    modules: 4,
    enrolled: 248,
    completed: 215,
    rating: 4.2,
    status: "Mandatory",
    nextSession: "Due Mar 31, 2026",
    instructor: "Legal Team",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "4",
    title: "Product Design Thinking",
    description: "Learn human-centered design methodology and apply it to real product challenges.",
    type: "Design",
    format: "Workshop",
    duration: "6 hours",
    modules: 8,
    enrolled: 32,
    completed: 24,
    rating: 4.9,
    status: "Active",
    nextSession: "Apr 2, 2026",
    instructor: "Emily Rodriguez",
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "5",
    title: "Sales Techniques Mastery",
    description: "Advanced sales training covering consultative selling, negotiation, and closing strategies.",
    type: "Sales",
    format: "Video",
    duration: "10 hours",
    modules: 15,
    enrolled: 52,
    completed: 45,
    rating: 4.5,
    status: "Active",
    nextSession: "Self-paced",
    instructor: "David Kim",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "6",
    title: "AWS Cloud Architecture",
    description: "Deep dive into AWS services, architecture patterns, and best practices for cloud-native applications.",
    type: "Technical",
    format: "Video",
    duration: "12 hours",
    modules: 18,
    enrolled: 38,
    completed: 28,
    rating: 4.7,
    status: "Active",
    nextSession: "Self-paced",
    instructor: "Chris Martinez",
  },
  ]; // end _unused
}

function TrainingPrograms() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"programs" | "records">("programs");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({ title: "", category: "General", durationHours: "4" });

  const { data: programsData, isLoading: loadingPrograms, isError, refetch} = useQuery({
    queryKey: ["hrm-training-programs"],
    queryFn: () => nucleoApi.hrm.training.programs.list({ page: 1, limit: 100 }),
  });

  const { data: recordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ["hrm-training-records"],
    queryFn: () => nucleoApi.hrm.training.records.list({ page: 1, limit: 100 }),
  });

  const createProgram = useMutation({
    mutationFn: (data: any) => nucleoApi.hrm.training.programs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] });
      toast.success("Training program created");
      setIsCreateOpen(false);
      setNewProgram({ title: "", category: "General", durationHours: "4" });
    },
    onError: () => toast.error("Failed to create program"),
  });

  const programs: any[] = (programsData as any)?.data ?? [];
  const records: any[] = (recordsData as any)?.data ?? [];

  const types = ["All", ...Array.from(new Set(programs.map((p: any) => p.category ?? p.type ?? "General")))];
  const statuses = ["All", "Active", "Mandatory", "Archived"];

  const filteredPrograms = programs.filter((p) => {
    if (!search.trim()) return true;
    return (
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Training Programs</h2>
          <p className="text-sm text-muted-foreground">
            Learning and development for your team
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export Records
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Program
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Programs</p>
              <p className="text-xl font-bold text-foreground">{programs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignments</p>
              <p className="text-xl font-bold text-foreground">{records.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completions</p>
              <p className="text-xl font-bold text-foreground">
                {records.filter((r) => r.status === "completed" || r.completedAt).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        {[
          { id: "programs", label: "Programs", icon: BookOpen },
          { id: "records", label: "Training Records", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Programs View */}
      {viewMode === "programs" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {types.map((type: any) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {statuses.map((status: any) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Programs Grid */}
          {loadingPrograms ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No programs found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? "Try adjusting your search" : "Create your first training program"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program: any) => (
                <div key={program.id} className="rounded-lg border border-border/60 bg-card p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      program.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : program.status === "mandatory"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-gray-500/10 text-gray-500"
                    }`}>
                      {program.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{program.title}</h3>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{program.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {program.category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {program.category}
                      </span>
                    )}
                    {program.provider && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {program.provider}
                      </span>
                    )}
                    {program.durationHours && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {program.durationHours}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Program Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Training Program</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Program title"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <input
                  type="text"
                  value={newProgram.category}
                  onChange={(e) => setNewProgram((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Technical, Leadership"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Duration (hours)</label>
                <input
                  type="number"
                  value={newProgram.durationHours}
                  onChange={(e) => setNewProgram((p) => ({ ...p, durationHours: e.target.value }))}
                  min="1"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newProgram.title.trim()) return;
                  createProgram.mutate({
                    title: newProgram.title,
                    category: newProgram.category,
                    durationHours: parseInt(newProgram.durationHours) || 4,
                  });
                }}
                disabled={createProgram.isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createProgram.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Records View */}
      {viewMode === "records" && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          {loadingRecords ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No training records found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: any) => (
                  <tr key={record.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{record.employeeId ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{record.programId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        record.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.progress !== undefined ? (
                        <span className="font-semibold text-foreground">{record.progress}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {record.completedAt ? new Date(record.completedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

