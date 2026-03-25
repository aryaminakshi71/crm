import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Send,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  Settings,
  Search,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/notifications")({
  component: Notifications,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "sms",
    recipient: "John Smith",
    phone: "+1 (555) 123-4567",
    message: "You have a new job assignment: JOB-1047 at 456 Park Ave",
    sentAt: "9:45 AM",
    status: "delivered",
    job: "JOB-1047",
  },
  {
    id: 2,
    type: "email",
    recipient: "Acme Corporation",
    email: "facilities@acmecorp.com",
    message: "Your technician is en route. Estimated arrival: 10:30 AM",
    sentAt: "9:50 AM",
    status: "delivered",
    job: "JOB-1042",
  },
  {
    id: 3,
    type: "sms",
    recipient: "Jane Doe",
    phone: "+1 (555) 234-5678",
    message: "Job JOB-1042 update: Diagnosis complete. Parts ordered.",
    sentAt: "10:45 AM",
    status: "delivered",
    job: "JOB-1042",
  },
  {
    id: 4,
    type: "email",
    recipient: "TechStart Inc",
    email: "ops@techstart.com",
    message: "Your service appointment has been confirmed for tomorrow at 2:00 PM",
    sentAt: "Yesterday",
    status: "delivered",
    job: "JOB-1045",
  },
  {
    id: 5,
    type: "sms",
    recipient: "Sarah Johnson",
    phone: "+1 (555) 456-7890",
    message: "Reminder: You have 3 jobs scheduled for today",
    sentAt: "Yesterday",
    status: "failed",
    job: null,
  },
  {
    id: 6,
    type: "email",
    recipient: "Metro Hospital",
    email: "maintenance@metrohospital.com",
    message: "Your generator maintenance service is complete. Thank you for choosing ServiceNova!",
    sentAt: "Mar 18, 2:30 PM",
    status: "delivered",
    job: "JOB-1035",
  },
];

const templates = [
  { id: 1, name: "Technician En Route", message: "Your technician {technician} is en route. Estimated arrival: {eta}", usageCount: 156 },
  { id: 2, name: "Technician Arrived", message: "Your technician has arrived at {address}", usageCount: 142 },
  { id: 3, name: "Job Complete", message: "Your service request {job_id} has been completed. Thank you!", usageCount: 128 },
  { id: 4, name: "Appointment Reminder", message: "Reminder: You have a service appointment scheduled for {date} at {time}", usageCount: 98 },
  { id: 5, name: "Parts Delayed", message: "We apologize for the delay. Parts for your job are expected by {time}", usageCount: 34 },
];

function Notifications() {
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["field-service-jobs-notifications"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/field-service/jobs`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const notifications = MOCK_NOTIFICATIONS;

  const sentToday = notifications.filter((n) => !["Yesterday", "Mar 18, 2:30 PM"].includes(n.sentAt)).length;
  const failedCount = notifications.filter((n) => n.status === "failed").length;
  const deliveredCount = notifications.filter((n) => n.status === "delivered").length;
  const deliveryRate = notifications.length > 0
    ? ((deliveredCount / notifications.length) * 100).toFixed(1)
    : "98.2";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customer Notification Center</h2>
          <p className="text-sm text-muted-foreground">
            Manage automated and manual customer communications
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Send className="h-4 w-4" />
            Send Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Send className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{sentToday}</p>
            <p className="text-xs text-muted-foreground">Sent Today</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{deliveryRate}%</p>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Bell className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{isLoading ? "…" : ((jobsData as any)?.data?.filter((j: { status: string }) => j.status === "pending")?.length ?? 12)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="push">Push</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Jobs</option>
          <option value="JOB-1042">JOB-1042</option>
          <option value="JOB-1043">JOB-1043</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.status === "failed" ? "border-red-500/20 bg-red-500/5" :
                      "border-border/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notif.type === "sms" ? "bg-blue-500/10" :
                        notif.type === "email" ? "bg-purple-500/10" :
                        "bg-amber-500/10"
                      }`}>
                        {notif.type === "sms" ? (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{notif.recipient}</span>
                          {notif.job && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {notif.job}
                            </span>
                          )}
                          <span className={`ml-auto text-xs flex items-center gap-1 ${
                            notif.status === "delivered" ? "text-green-500" :
                            notif.status === "failed" ? "text-red-500" :
                            "text-amber-500"
                          }`}>
                            {notif.status === "delivered" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : notif.status === "failed" ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {notif.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{notif.sentAt}</span>
                          {notif.email && <span>{notif.email}</span>}
                          {notif.phone && <span>{notif.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Message Templates</h3>
              <button className="text-xs text-primary hover:underline">Manage</button>
            </div>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <span className="text-xs text-muted-foreground">{template.usageCount}x</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
