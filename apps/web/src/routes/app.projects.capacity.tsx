import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Users,
  AlertCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { nucleoApi } from "@/lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/capacity")({
  component: CapacityPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type TeamMember = {
  id: string;
  name: string;
  role: string;
  capacity: number; // hours per day
  allocation: number; // percentage
  avatar?: string;
};

type DayCapacity = {
  date: string;
  dayOfWeek: string;
  hours: number;
  utilization: number;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function CapacityPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Fetch all projects, then resources for first project
  const { data: projectsData, isError, refetch} = useQuery({
    queryKey: ["nucleo-projects-capacity"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 50 }),
  });

  const firstProjectId = projectsData?.data?.[0]?.id;

  const { data: resourcesData } = useQuery({
    queryKey: ["nucleo-project-resources-capacity", firstProjectId],
    queryFn: () => nucleoApi.projects.resources.list(firstProjectId!),
    enabled: !!firstProjectId,
  });

  // Map API resources to TeamMember shape; fall back to empty array
  const teamMembers: TeamMember[] = useMemo(() => {
    const resources = (resourcesData as any)?.data ?? [];
    if (resources.length === 0) return [];
    return resources.map((r: any) => ({
      id: r.id,
      name: r.name ?? r.userName ?? "Team Member",
      role: r.role ?? r.jobTitle ?? "Member",
      capacity: 8,
      allocation: typeof r.allocation === "number" ? r.allocation : 80,
    }));
  }, [resourcesData]);

  // Generate week days
  const getWeekDays = (date: Date) => {
    const days: DayCapacity[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push({
        date: day.toISOString().split("T")[0],
        dayOfWeek: day.toLocaleDateString(undefined, { weekday: "short" }),
        hours: 8,
        utilization: Math.floor(Math.random() * 40) + 60, // Mock 60-100%
      });
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeek);

  // Navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Calculate totals
  const totalCapacity = teamMembers.reduce((sum, m) => sum + m.capacity, 0);
  const totalAllocation = teamMembers.reduce(
    (sum, m) => sum + (m.capacity * m.allocation) / 100,
    0
  );
  const avgUtilization = teamMembers.length > 0
    ? teamMembers.reduce((sum, m) => sum + m.allocation, 0) / teamMembers.length
    : 0;

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return "bg-destructive";
    if (utilization >= 85) return "bg-warning";
    return "bg-success";
  };

  // Get cell color based on allocation
  const getCellColor = (allocation: number) => {
    if (allocation > 100) return "bg-destructive/20 border-destructive";
    if (allocation > 85) return "bg-warning/20 border-warning";
    if (allocation >= 70) return "bg-success/20 border-success";
    return "bg-muted/20 border-muted";
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Capacity Planning</h2>
          <p className="text-muted-foreground text-sm">
            Manage team workload and resource allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCapacity}h</p>
                <p className="text-xs text-muted-foreground">Weekly Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <User className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAllocation.toFixed(0)}h</p>
                <p className="text-xs text-muted-foreground">Allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                avgUtilization >= 100 ? "bg-destructive/10" : avgUtilization >= 85 ? "bg-warning/10" : "bg-success/10"
              }`}>
                <div className={`h-5 w-5 rounded-full ${
                  avgUtilization >= 100 ? "text-destructive" : avgUtilization >= 85 ? "text-warning" : "text-success"
                }`}>
                  {avgUtilization.toFixed(0)}%
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">Utilization</p>
                <p className="text-xs text-muted-foreground">Team Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 font-medium">
                {weekDays[0].date} - {weekDays[6].date}
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-success/20 border border-success" />
                <span className="text-muted-foreground">70-85%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-warning/20 border border-warning" />
                <span className="text-muted-foreground">85-100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-destructive/20 border border-destructive" />
                <span className="text-muted-foreground">Overloaded</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Grid */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-48">
                  Team Member
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.date}
                    className="p-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[100px]"
                  >
                    <div>{day.dayOfWeek}</div>
                    <div className="text-muted-foreground/60 font-normal">
                      {new Date(day.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </th>
                ))}
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const isSelected = selectedMember === member.id;
                return (
                  <tr
                    key={member.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                    onClick={() =>
                      setSelectedMember(isSelected ? null : member.id)
                    }
                  >
                    {/* Member Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Daily Cells */}
                    {weekDays.map((day) => {
                      const cellAllocation = Math.floor(
                        member.allocation * (day.hours / 8)
                      );
                      return (
                        <td
                          key={day.date}
                          className={`p-2 border border-border/30 rounded-md mx-1 ${getCellColor(cellAllocation)}`}
                        >
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {cellAllocation}%
                            </p>
                            <div className="h-1 mt-1 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getUtilizationColor(cellAllocation)}`}
                                style={{ width: `${Math.min(100, cellAllocation)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td className="p-4 text-center">
                      <div className={`font-bold ${
                        member.allocation > 100 ? "text-destructive" :
                        member.allocation > 85 ? "text-warning" : "text-foreground"
                      }`}>
                        {member.allocation}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(member.capacity * member.allocation / 100).toFixed(0)}h
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Member Detail */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              {teamMembers.find((m) => m.id === selectedMember)?.name} - Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const member = teamMembers.find((m) => m.id === selectedMember)!;
                const allocatedHours = (member.capacity * member.allocation) / 100;
                return (
                  <div
                    key={day.date}
                    className={`p-3 rounded-lg border ${getCellColor(member.allocation)}`}
                  >
                    <p className="text-xs text-muted-foreground">{day.dayOfWeek}</p>
                    <p className="text-lg font-bold">{allocatedHours.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">
                      of {day.hours}h
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
