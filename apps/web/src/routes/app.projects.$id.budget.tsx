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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  DollarSign,
  Download,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
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
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id/budget")({
  component: BudgetPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type BudgetItem = {
  id: string;
  category: string;
  description: string;
  allocated: number;
  spent: number;
  remaining: number;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function BudgetPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
  });

  // Fetch project
  const { data: projectData } = useQuery({
    queryKey: ["nucleo-project", id],
    queryFn: () => nucleoApi.projects.get(id),
    enabled: !!id,
  });

  const project = projectData?.data;

  // Mock budget data (in real app, would come from API)
  const budgetItems: BudgetItem[] = [
    { id: "1", category: "Development", description: "Engineering team", allocated: 50000, spent: 35000, remaining: 15000 },
    { id: "2", category: "Design", description: "UI/UX and branding", allocated: 20000, spent: 18000, remaining: 2000 },
    { id: "3", category: "Infrastructure", description: "Servers and hosting", allocated: 15000, spent: 12000, remaining: 3000 },
    { id: "4", category: "Marketing", description: "Launch campaigns", allocated: 25000, spent: 8000, remaining: 17000 },
    { id: "5", category: "Contingency", description: "Emergency fund", allocated: 10000, spent: 0, remaining: 10000 },
  ];

  const totalAllocated = budgetItems.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const utilizationPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Budget health
  const getBudgetHealth = () => {
    if (utilizationPercent > 100) return { status: "critical", color: "text-destructive", bg: "bg-destructive/10" };
    if (utilizationPercent > 85) return { status: "warning", color: "text-warning", bg: "bg-warning/10" };
    return { status: "healthy", color: "text-success", bg: "bg-success/10" };
  };

  const budgetHealth = getBudgetHealth();

  // Sparkline data (weekly spending)
  const weeklySpendingData = [
    { week: "W1", spent: 5000 },
    { week: "W2", spent: 8000 },
    { week: "W3", spent: 6000 },
    { week: "W4", spent: 12000 },
    { week: "W5", spent: 9000 },
    { week: "W6", spent: 15000 },
  ];

  // Category breakdown for pie chart
  const categoryBreakdown = budgetItems.map((item) => ({
    name: item.category,
    value: item.allocated,
    spent: item.spent,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Budget Tracking</h2>
          <p className="text-muted-foreground text-sm">
            Monitor project expenses and allocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export Report
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddExpenseOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className={`rounded-xl border p-4 ${budgetHealth.bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Budget Health</p>
            <p className={`text-2xl font-bold ${budgetHealth.color}`}>
              {budgetHealth.status.charAt(0).toUpperCase() + budgetHealth.status.slice(1)}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold">${totalAllocated.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xl font-bold text-warning">${totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold text-success">${totalRemaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Utilization</span>
            <span className={budgetHealth.color}>{utilizationPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                utilizationPercent > 100
                  ? "bg-destructive"
                  : utilizationPercent > 85
                    ? "bg-warning"
                    : "bg-success"
              }`}
              style={{ width: `${Math.min(100, utilizationPercent)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Spending Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklySpendingData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Spent"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#22d3ee", "#f59e0b", "#22c55e", "#a855f7", "#ec4899"][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Allocated"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryBreakdown.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ["#22d3ee", "#f59e0b", "#22c55e", "#a855f7", "#ec4899"][index % 5] }}
                    />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-bold">${cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-sm font-bold">Budget Breakdown</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {budgetItems.map((item) => {
            const itemUtilization = (item.spent / item.allocated) * 100;
            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.category}</p>
                      <Badge
                        variant={
                          itemUtilization > 100
                            ? "danger"
                            : itemUtilization > 85
                              ? "warning"
                              : "success"
                        }
                        size="sm"
                      >
                        {itemUtilization.toFixed(0)}% used
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">${item.spent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      of ${item.allocated.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        itemUtilization > 100
                          ? "bg-destructive"
                          : itemUtilization > 85
                            ? "bg-warning"
                            : "bg-success"
                      }`}
                      style={{ width: `${Math.min(100, itemUtilization)}%` }}
                    />
                  </div>
                </div>

                {/* Sparkline for item */}
                <div className="mt-2 h-8 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { m: "M1", v: item.spent * 0.6 },
                      { m: "M2", v: item.spent * 0.75 },
                      { m: "M3", v: item.spent * 0.85 },
                      { m: "M4", v: item.spent },
                    ]}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#888"
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Expense Modal */}
      <FormModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add Expense"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Expense added");
          setIsAddExpenseOpen(false);
          setNewExpense({ category: "", description: "", amount: "" });
        }}
      >
        <div className="space-y-4">
          <FormField label="Category">
            <select
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense((e) => ({ ...e, category: e.target.value }))
              }
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Description">
            <Input
              value={newExpense.description}
              onChange={(e) =>
                setNewExpense((e) => ({ ...e, description: e.target.value }))
              }
              placeholder="Enter description..."
            />
          </FormField>
          <FormField label="Amount">
            <Input
              type="number"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense((e) => ({ ...e, amount: e.target.value }))
              }
              placeholder="$0.00"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
