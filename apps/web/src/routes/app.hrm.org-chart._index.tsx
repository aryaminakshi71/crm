import { Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { hrmApi } from "@/lib/api";

const orgChartTooltipStyle = {
  background: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "11px",
};

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/hrm/org-chart/_index")({
  validateSearch: searchSchema,
  component: OrgChartPage,
});

function OrgChartPage() {
  const { q: search = "" } = useSearch({ from: "/app/hrm/org-chart/_index" });
  const navigate = useNavigate({ from: "/app/hrm/org-chart" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["hrm-employees-org"],
    queryFn: () => hrmApi.employees.list({ page: 1, limit: 200 }),
  });

  const employees: any[] = (data as any)?.data ?? [];

  const departments = useMemo(() => {
    const map: Record<string, any[]> = {};
    employees.forEach((e) => {
      const dept = e.department ?? "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(e);
    });
    return map;
  }, [employees]);

  const filtered = useMemo(() => {
    if (!search) return departments;
    const q = search.toLowerCase();
    const result: Record<string, any[]> = {};
    Object.entries(departments).forEach(([dept, emps]) => {
      const match = emps.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          (e.jobTitle ?? "").toLowerCase().includes(q),
      );
      if (match.length) result[dept] = match;
    });
    return result;
  }, [departments, search]);

  if (isLoading) return <Loading />;

  const totalDepts = Object.keys(departments).length;
  const avgSpan =
    totalDepts > 0 ? Math.round(employees.length / totalDepts) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6" /> Org Chart
          </h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} employees across {totalDepts} departments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Employees", value: employees.length },
          { label: "Departments", value: totalDepts },
          { label: "Avg Span of Control", value: avgSpan },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Headcount by Department Chart */}
      {Object.keys(departments).length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Headcount by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={Object.entries(departments).map(([dept, emps]) => ({ dept, count: emps.length }))}
                  margin={{ left: 16, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} stroke="#888" allowDecimals={false} />
                  <YAxis type="category" dataKey="dept" axisLine={false} tickLine={false} fontSize={10} stroke="#888" width={90} />
                  <Tooltip contentStyle={orgChartTooltipStyle} formatter={(v: number) => [v, "Employees"]} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(filtered).map(([dept, emps]) => (
          <Card key={dept}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                {dept}
                <span className="text-sm font-normal text-muted-foreground">
                  {emps.length} members
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {emps.map((emp) => {
                  const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || "Unknown";
                  const initial = name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {emp.jobTitle ?? emp.role ?? ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
