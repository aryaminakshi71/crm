import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Package,
  AlertCircle,
  Edit,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/technicians/$id")({
  component: TechnicianDetail,
});

const technician = {
  id: "1",
  name: "John Smith",
  email: "john.smith@servicenova.com",
  phone: "+1 (555) 123-4567",
  avatar: null,
  status: "available",
  skills: ["HVAC", "Electrical", "Refrigeration", "Solar Panels"],
  rating: 4.9,
  jobsCompleted: 342,
  revenue: "$68,400",
  hireDate: "2021-03-15",
  currentLocation: "Manhattan, NY",
  certifications: ["EPA 608", "NATE Certified", "Licensed Electrician"],
  currentJob: null,
  upcomingJobs: [
    { id: "JOB-1047", title: "HVAC Installation", time: "2:00 PM", address: "456 Park Ave" },
    { id: "JOB-1048", title: "Electrical Panel Upgrade", time: "4:30 PM", address: "789 Broadway" },
  ],
  recentJobs: [
    { id: "JOB-1040", title: "AC Repair", customer: "Downtown Office", status: "completed", date: "Today 9:00 AM" },
    { id: "JOB-1035", title: "Generator Maintenance", customer: "Harbor View Hotel", status: "completed", date: "Yesterday 2:00 PM" },
    { id: "JOB-1032", title: "Electrical Inspection", customer: "TechStart Inc", status: "completed", date: "Mar 18, 10:00 AM" },
  ],
  performance: {
    avgRating: 4.9,
    avgResponseTime: "18 min",
    avgJobDuration: "1.2 hrs",
    slaCompliance: "98%",
  },
};

function TechnicianDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/app/field-service/technicians"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">Technician Details</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
          <Edit className="h-4 w-4" />
          Edit
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <MessageSquare className="h-4 w-4" />
          Message
        </button>
      </div>

      {/* Profile Card */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">JS</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{technician.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{technician.rating}</span>
                    </div>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-sm text-muted-foreground">{technician.jobsCompleted} jobs completed</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-sm text-green-600 font-medium">{technician.revenue} revenue</span>
                  </div>
                </div>
                <span className={`rounded-full px-4 py-1 text-sm font-medium ${
                  technician.status === "available" ? "bg-green-500/10 text-green-500" :
                  technician.status === "on_job" ? "bg-blue-500/10 text-blue-500" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {technician.status.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{technician.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{technician.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{technician.currentLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hired {technician.hireDate}</span>
                </div>
              </div>

              {/* Skills & Certifications */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {technician.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {technician.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.performance.avgRating}</p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.performance.avgResponseTime}</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Wrench className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.performance.avgJobDuration}</p>
            <p className="text-xs text-muted-foreground">Avg Job Duration</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.performance.slaCompliance}</p>
            <p className="text-xs text-muted-foreground">SLA Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {technician.upcomingJobs.map((job) => (
                <Link
                  key={job.id}
                  to="/app/field-service/jobs/$id"
                  params={{ id: job.id }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-16 text-center border-r border-border/40 pr-4">
                    <p className="text-sm font-medium">{job.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.address}
                    </p>
                  </div>
                  <span className="text-xs text-primary">{job.id}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Recent Jobs</h3>
            <div className="space-y-3">
              {technician.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to="/app/field-service/jobs/$id"
                  params={{ id: job.id }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    job.status === "completed" ? "bg-green-500" : "bg-muted"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.customer}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{job.date}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment & Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Assigned Equipment</h3>
              <Link to="/app/field-service/equipment" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">iPhone 14 Pro</p>
                    <p className="text-xs text-muted-foreground">Serial: ABC123456</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Thermal Printer</p>
                    <p className="text-xs text-muted-foreground">Model: Zebra ZD420</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Parts Inventory</h3>
              <Link to="/app/field-service/parts" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div>
                  <p className="font-medium">HVAC Filters (20x25x1)</p>
                  <p className="text-xs text-muted-foreground">Qty in stock: 12</p>
                </div>
                <span className="text-xs text-amber-500">Low Stock</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div>
                  <p className="font-medium">Capacitor 45/5</p>
                  <p className="text-xs text-muted-foreground">Qty in stock: 8</p>
                </div>
                <span className="text-xs text-green-500">In Stock</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
