import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/leave/calendar")({
  component: LeaveCalendar,
});

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const leaveEvents = [
  { id: "1", name: "Alex Thompson", type: "Annual Leave", startDay: 25, endDay: 29, color: "bg-blue-500", dept: "Engineering" },
  { id: "2", name: "Jessica Lee", type: "Sick Leave", startDay: 22, endDay: 23, color: "bg-amber-500", dept: "Engineering" },
  { id: "3", name: "Michael Brown", type: "Annual Leave", startDay: 1, endDay: 10, color: "bg-blue-500", dept: "Marketing", monthOffset: 1 },
  { id: "4", name: "Amanda White", type: "Personal Day", startDay: 24, endDay: 24, color: "bg-purple-500", dept: "Operations" },
  { id: "5", name: "David Kim", type: "Annual Leave", startDay: 18, endDay: 20, color: "bg-blue-500", dept: "Sales" },
  { id: "6", name: "Emily Rodriguez", type: "Sick Leave", startDay: 15, endDay: 15, color: "bg-amber-500", dept: "Design" },
  { id: "7", name: "Chris Martinez", type: "Annual Leave", startDay: 10, endDay: 16, color: "bg-blue-500", dept: "Engineering", monthOffset: -1 },
  { id: "8", name: "Lisa Wang", type: "Personal Day", startDay: 12, endDay: 13, color: "bg-purple-500", dept: "Marketing" },
  { id: "9", name: "Sarah Chen", type: "Annual Leave", startDay: 5, endDay: 9, color: "bg-blue-500", dept: "Engineering" },
  { id: "10", name: "James Wilson", type: "Sick Leave", startDay: 28, endDay: 28, color: "bg-amber-500", dept: "Sales" },
];

function LeaveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [showLegend, setShowLegend] = useState(false);

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
    setCurrentDate(new Date(2026, 2, 1));
  };

  const filteredEvents = leaveEvents.filter((event) => {
    const monthMatch = event.monthOffset === undefined || event.monthOffset === 0;
    return monthMatch && (selectedDept === "All Departments" || event.dept === selectedDept);
  });

  const departments = ["All Departments", "Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push({ day: null, events: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = filteredEvents.filter(
      (event) => day >= event.startDay && day <= event.endDay
    );
    days.push({ day, events: dayEvents });
  }

  // Fill remaining cells
  while (days.length % 7 !== 0) {
    days.push({ day: null, events: [] });
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const today = { day: 20, month: 2, year: 2026 };

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
              const isToday = dayData.day === today.day && month === today.month && year === today.year;
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
          <div className="space-y-3">
            {filteredEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${event.color}`} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.dept}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{event.startDay} - {event.endDay} {monthNames[month]}</p>
                  <p className="text-xs text-muted-foreground">{event.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
