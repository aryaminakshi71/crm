import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  DollarSign,
  Download,
  Play,
  Square,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { nucleoApi } from "../lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id/time")({
  component: TimeTrackingPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type TimeEntry = {
  id: string;
  taskId: string;
  taskName: string;
  userId: string;
  userName: string;
  duration: number; // in minutes
  date: string;
  description?: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function TimeTrackingPage() {
  const { id } = Route.useParams();

  const [activeTimer, setActiveTimer] = useState<{
    taskId: string;
    taskName: string;
    startTime: Date;
  } | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Mock data
  const timeEntries: TimeEntry[] = [
    { id: "1", taskId: "t1", taskName: "API Integration", userId: "u1", userName: "Sarah Chen", duration: 240, date: "2024-01-15", description: "Worked on REST endpoints" },
    { id: "2", taskId: "t2", taskName: "UI Design", userId: "u2", userName: "Mike Johnson", duration: 180, date: "2024-01-15", description: "Dashboard mockups" },
    { id: "3", taskId: "t1", taskName: "API Integration", userId: "u1", userName: "Sarah Chen", duration: 120, date: "2024-01-14", description: "Authentication flow" },
    { id: "t3", taskId: "t3", taskName: "Database Setup", userId: "u3", userName: "Emily Davis", duration: 300, date: "2024-01-14", description: "Schema design" },
  ];

  // Calculate totals
  const totalHoursToday = timeEntries
    .filter((e) => e.date === "2024-01-15")
    .reduce((sum, e) => sum + e.duration, 0) / 60;

  const totalHoursWeek = timeEntries.reduce((sum, e) => sum + e.duration, 0) / 60;

  const totalCost = totalHoursWeek * 75; // $75/hr rate

  // Daily time data for chart
  const dailyTimeData = [
    { day: "Mon", hours: 7.5 },
    { day: "Tue", hours: 8.2 },
    { day: "Wed", hours: 6.5 },
    { day: "Thu", hours: 8.0 },
    { day: "Fri", hours: 5.5 },
  ];

  // Team time distribution
  const teamTimeData = [
    { name: "Sarah Chen", hours: 12.5, color: "#22d3ee" },
    { name: "Mike Johnson", hours: 10.2, color: "#f59e0b" },
    { name: "Emily Davis", hours: 8.8, color: "#22c55e" },
  ];

  // Timer effect
  useState(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  });

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Time Tracking</h2>
          <p className="text-muted-foreground text-sm">
            Track time spent on project tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Timer Widget */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Timer className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Timer</p>
                <p className="text-xl font-bold">
                  {activeTimer ? activeTimer.taskName : "No timer running"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-mono font-bold">
                  {formatTime(activeTimer ? timerElapsed : 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeTimer ? "Running" : "Idle"}
                </p>
              </div>

              {activeTimer ? (
                <Button
                  variant="danger"
                  size="lg"
                  leftIcon={<Square className="h-5 w-5" />}
                  onClick={() => {
                    setActiveTimer(null);
                    setTimerElapsed(0);
                  }}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Play className="h-5 w-5" />}
                  onClick={() => {
                    setActiveTimer({
                      taskId: "t1",
                      taskName: "New Task",
                      startTime: new Date(),
                    });
                  }}
                >
                  Start Timer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHoursToday.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHoursWeek.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Labor Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Time Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Daily Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTimeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    formatter={(value: any) => [`${value}h`, "Hours"]}
                  />
                  <Bar dataKey="hours" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Team Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teamTimeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="hours"
                    stroke="none"
                  >
                    {teamTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    formatter={(value: any) => [`${value}h`, "Hours"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {teamTimeData.map((member) => (
                <div key={member.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: member.color }} />
                    <span className="text-muted-foreground">{member.name}</span>
                  </div>
                  <span className="font-bold">{member.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-sm font-bold">Recent Time Entries</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {entry.userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{entry.taskName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{entry.userName}</span>
                  {entry.description && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{entry.description}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{formatDuration(entry.duration)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" size="sm">
                ${((entry.duration / 60) * 75).toFixed(0)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
