import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Calendar,
  TrendingUp,
  MoreVertical,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/technicians")({
  component: Technicians,
});

const technicians = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@servicenova.com",
    phone: "+1 (555) 123-4567",
    avatar: null,
    status: "available",
    skills: ["HVAC", "Electrical", "Refrigeration"],
    rating: 4.9,
    jobsCompleted: 342,
    revenue: "$68,400",
    hireDate: "2021-03-15",
    currentLocation: "Manhattan, NY",
  },
  {
    id: 2,
    name: "Jane Doe",
    email: "jane.doe@servicenova.com",
    phone: "+1 (555) 234-5678",
    avatar: null,
    status: "on_job",
    skills: ["Plumbing", "HVAC", "Water Heaters"],
    rating: 4.8,
    jobsCompleted: 289,
    revenue: "$57,800",
    hireDate: "2021-06-01",
    currentLocation: "Brooklyn, NY",
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@servicenova.com",
    phone: "+1 (555) 345-6789",
    avatar: null,
    status: "on_break",
    skills: ["Electrical", "Generators", "Solar"],
    rating: 4.7,
    jobsCompleted: 256,
    revenue: "$51,200",
    hireDate: "2022-01-10",
    currentLocation: "Queens, NY",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah.johnson@servicenova.com",
    phone: "+1 (555) 456-7890",
    avatar: null,
    status: "available",
    skills: ["Plumbing", "Bathroom Remodel", "Water Treatment"],
    rating: 4.9,
    jobsCompleted: 198,
    revenue: "$39,600",
    hireDate: "2022-04-20",
    currentLocation: "Bronx, NY",
  },
  {
    id: 5,
    name: "Tom Brown",
    email: "tom.brown@servicenova.com",
    phone: "+1 (555) 567-8901",
    avatar: null,
    status: "on_job",
    skills: ["HVAC", "Generators", "Commercial Refrigeration"],
    rating: 4.6,
    jobsCompleted: 167,
    revenue: "$33,400",
    hireDate: "2022-08-15",
    currentLocation: "Manhattan, NY",
  },
  {
    id: 6,
    name: "Lisa Chen",
    email: "lisa.chen@servicenova.com",
    phone: "+1 (555) 678-9012",
    avatar: null,
    status: "available",
    skills: ["Electrical", "Plumbing", "Smart Home"],
    rating: 4.8,
    jobsCompleted: 145,
    revenue: "$29,000",
    hireDate: "2023-02-01",
    currentLocation: "Staten Island, NY",
  },
];

function Technicians() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Technician Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage field technicians, skills, and performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Technician
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search technicians..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="on_job">On Job</option>
          <option value="on_break">On Break</option>
          <option value="offline">Offline</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Skills</option>
          <option value="hvac">HVAC</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="generators">Generators</option>
        </select>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <Card key={tech.id} className="border-border/60 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <Link to="/app/field-service/technicians/$id" params={{ id: String(tech.id) }} className="font-medium text-foreground hover:text-primary transition-colors">
                      {tech.name}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{tech.rating}</span>
                      <span className="mx-1">-</span>
                      <span>{tech.jobsCompleted} jobs</span>
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{tech.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{tech.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{tech.currentLocation}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {tech.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-bold text-green-600">{tech.revenue}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hired</p>
                  <p className="font-medium text-foreground">{tech.hireDate}</p>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tech.status === "available" ? "bg-green-500/10 text-green-500" :
                  tech.status === "on_job" ? "bg-blue-500/10 text-blue-500" :
                  tech.status === "on_break" ? "bg-amber-500/10 text-amber-500" :
                  "bg-muted/10 text-muted-foreground"
                }`}>
                  {tech.status.replace("_", " ")}
                </span>
                <Link
                  to="/app/field-service/technicians/$id"
                  params={{ id: String(tech.id) }}
                  className="text-xs text-primary hover:underline"
                >
                  View Details
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
