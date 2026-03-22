import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm/leave/calendar")({
  component: LeaveCalendar,
});

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const LEAVE_COLOR_MAP: Record<string, string> = {
  annual: "bg-blue-500",
  sick: "bg-amber-500",
  personal: "bg-purple-500",
  maternity: "bg-pink-500",
  paternity: "bg-indigo-500",
  unpaid: "bg-gray-500",
};

function getLeaveColor(leaveType: string): string {
  return LEAVE_COLOR_MAP[leaveType?.toLowerCase()] ?? "bg-gray-500";
}

function LeaveCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [showLegend, setShowLegend] = useState(false);

  const { data: leaveData } = useQuery({
    queryKey: ["hrm-leave-requests-calendar"],
    queryFn: () => nucleoApi.hrm.leaveRequests.list({ page: 1, limit: 200 }),
  });

  const allLeave: any[] = leaveData?.data ?? [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Convert API leave requests to calendar events for the current month
  const leaveEvents = useMemo(() => {
    return allLeave
      .filter((l) => l.status !== "rejected")
      .map((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return {
          id: l.id,
          name: l.employee ?? "Employee",
          type: l.leaveType ?? "annual",
          color: getLeaveColor(l.leaveType),
          startDate: start,
          endDate: end,
        };
      });
  }, [allLeave]);

  // Filter events to those that overlap with the current month
  const filteredEvents = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return leaveEvents.filter((e) => e.startDate <= monthEnd && e.endDate >= monthStart);
  }, [leaveEvents, year, month]);

  // Get all unique departments from employee names (not available from API, use empty list)
  const departments = ["All Departments"];

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push({ day: null, events: [] as typeof filteredEvents });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayEvents = filteredEvents.filter(
      (event) => event.startDate <= dayDate && event.endDate >= dayDate,
    );
    days.push({ day, events: dayEvents });
  }

  // Fill remaining cells
  while (days.length % 7 !== 0) {
    days.push({ day: null, events: [] as typeof filteredEvents });
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const todayDate = { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Time-Off Calendar</h2>
          <p className="text-sm text-muted-foreground">
            View team availability and scheduled time off
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showLegend ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted/50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Legend
          </button>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">Annual Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Sick Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-sm text-muted-foreground">Personal Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-500" />
            <span className="text-sm text-muted-foreground">Other</span>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border/60">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIdx) =>
            week.map((dayData, dayIdx) => {
              const isToday = dayData.day === todayDate.day && month === todayDate.month && year === todayDate.year;
              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={`min-h-[100px] border-b border-r border-border/40 p-1 ${
                    dayData.day === null ? "bg-muted/20" : "bg-card"
                  }`}
                >
                  {dayData.day && (
                    <>
                      <div className="flex items-center justify-between px-1 py-1">
                        <span
                          className={`text-sm font-medium ${
                            isToday
                              ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {dayData.day}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {dayData.events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium text-white ${event.color}`}
                            title={`${event.name} - ${event.type}`}
                          >
                            {event.name.split(" ")[0]}
                          </div>
                        ))}
                        {dayData.events.length > 3 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayData.events.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upcoming Time Off */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Upcoming Time Off</h3>
        </div>
        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No leave scheduled this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${event.color}`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{event.type.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">
                      {event.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" – "}
                      {event.endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
