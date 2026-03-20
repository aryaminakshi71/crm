import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Camera,
  Signature,
  CheckCircle2,
  AlertTriangle,
  Package,
  DollarSign,
  MessageSquare,
  MoreVertical,
  Play,
  Pause,
  Check,
  History,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/jobs/$id")({
  component: JobDetail,
});

const job = {
  id: "JOB-1042",
  title: "HVAC System Repair",
  customer: "Acme Corporation",
  customerId: "CUST-001",
  address: "123 Business Park Dr, Suite 400, Manhattan, NY 10001",
  phone: "+1 (555) 987-6543",
  email: "facilities@acmecorp.com",
  status: "in_progress",
  priority: "high",
  scheduledTime: "10:30 AM",
  scheduledDate: "2026-03-20",
  technician: "Jane Doe",
  technicianId: "2",
  type: "repair",
  description: "Main HVAC unit not cooling properly. Reports indicate warm air coming from vents. Customer mentions intermittent issue for past week.",
  estimatedDuration: "2 hours",
  actualDuration: null,
  sla: {
    responseDeadline: "11:00 AM",
    resolutionDeadline: "3:00 PM",
    status: "on_track",
  },
  timeline: [
    { time: "9:45 AM", event: "Job dispatched to Jane Doe", type: "dispatch" },
    { time: "9:50 AM", event: "Technician en route", type: "en_route" },
    { time: "10:15 AM", event: "Technician arrived on site", type: "arrived" },
    { time: "10:20 AM", event: "Diagnosis started - compressor issue suspected", type: "update" },
    { time: "10:45 AM", event: "Customer notified of diagnosis and estimated cost", type: "customer_update" },
  ],
  parts: [
    { name: "Compressor Scroll", sku: "COMP-001", qty: 1, price: 450, status: "pending" },
    { name: "Refrigerant R-410A", sku: "REF-410A", qty: 2, price: 120, status: "installed" },
  ],
  equipment: [
    { name: "Carrier 24ACC636A003", type: "HVAC Unit", serial: "CR-2024-12345", installed: "2019-06-15", warranty: "2026-06-14" },
  ],
  photos: [
    { id: 1, url: "/api/placeholder/200/200", caption: "Indoor unit thermostat", timestamp: "10:25 AM" },
    { id: 2, url: "/api/placeholder/200/200", caption: "Outdoor unit serial plate", timestamp: "10:26 AM" },
  ],
  signature: null,
  invoice: null,
  payments: [],
  notes: [
    { author: "Jane Doe", time: "10:20 AM", text: "Unit is 7 years old, may need full replacement soon" },
    { author: "Dispatch", time: "9:45 AM", text: "Priority customer - expedited response required" },
  ],
};

function JobDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/field-service/jobs" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{job.id}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              job.status === "completed" ? "bg-green-500/10 text-green-500" :
              job.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
              job.status === "scheduled" ? "bg-amber-500/10 text-amber-500" :
              "bg-muted/10 text-muted-foreground"
            }`}>
              {job.status.replace("_", " ")}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              job.priority === "high" ? "bg-red-500/10 text-red-500" :
              job.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
              "bg-blue-500/10 text-blue-500"
            }`}>
              {job.priority} priority
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{job.title}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          {job.status === "in_progress" ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors">
              <Check className="h-4 w-4" />
              Complete Job
            </button>
          ) : job.status === "scheduled" ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
              <Play className="h-4 w-4" />
              Start Job
            </button>
          ) : null}
        </div>
      </div>

      {/* SLA Status */}
      <Card className={job.sla.status === "at_risk" ? "border-amber-500/50 bg-amber-500/5" : "border-green-500/50 bg-green-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {job.sla.status === "at_risk" ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-foreground">SLA Status: {job.sla.status === "at_risk" ? "At Risk" : "On Track"}</p>
                <p className="text-xs text-muted-foreground">
                  Response deadline: {job.sla.responseDeadline} | Resolution deadline: {job.sla.resolutionDeadline}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Est. Duration: {job.estimatedDuration}</p>
              <p className="text-xs text-muted-foreground">Started: {job.timeline[job.timeline.length - 1]?.time}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Job Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{job.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-medium capitalize">{job.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                    <p className="text-sm">{job.scheduledDate} at {job.scheduledTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {job.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === "dispatch" ? "bg-blue-500" :
                        event.type === "en_route" ? "bg-amber-500" :
                        event.type === "arrived" ? "bg-green-500" :
                        "bg-muted-foreground"
                      }`} />
                      {idx < job.timeline.length - 1 && <div className="w-0.5 h-full bg-border/40 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{event.event}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parts Used */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Parts Used</h3>
                <button className="text-xs text-primary hover:underline">Add Part</button>
              </div>
              <div className="space-y-3">
                {job.parts.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{part.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {part.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Qty: {part.qty}</span>
                      <span className="text-sm font-medium">${part.price}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        part.status === "installed" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {part.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photos & Proof */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Proof of Service</h3>
                <button className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <Camera className="h-3 w-3" />
                  Add Photo
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {job.photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-lg border border-border/40 overflow-hidden">
                    <div className="aspect-square bg-muted/30 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs">{photo.caption}</p>
                      <p className="text-white/60 text-xs">{photo.timestamp}</p>
                    </div>
                  </div>
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center hover:bg-muted/30 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </button>
              </div>

              {/* Signature */}
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Customer Signature</h4>
                  <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Signature className="h-3 w-3" />
                    Capture Signature
                  </button>
                </div>
                <div className="h-24 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center">
                  {job.signature ? (
                    <p className="text-muted-foreground text-sm">Signature captured</p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No signature captured yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Customer</h3>
              <div className="space-y-3">
                <Link to="/app/crm" className="block">
                  <p className="font-medium text-primary hover:underline">{job.customer}</p>
                  <p className="text-xs text-muted-foreground">{job.customerId}</p>
                </Link>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{job.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{job.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{job.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technician */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Technician</h3>
              <Link to="/app/field-service/technicians/$id" params={{ id: job.technicianId }} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary hover:underline">{job.technician}</p>
                  <p className="text-xs text-muted-foreground">View profile</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Equipment</h3>
                <Link to="/app/field-service/equipment" className="text-xs text-primary hover:underline">Manage</Link>
              </div>
              <div className="space-y-3">
                {job.equipment.map((eq, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/40">
                    <p className="font-medium text-sm">{eq.name}</p>
                    <p className="text-xs text-muted-foreground">{eq.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">Serial: {eq.serial}</p>
                    <p className="text-xs text-muted-foreground">Installed: {eq.installed}</p>
                    <p className="text-xs text-amber-500 mt-1">Warranty: {eq.warranty}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice & Payment */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Invoice</h3>
                <Link to="/app/field-service/invoicing" className="text-xs text-primary hover:underline">View All</Link>
              </div>
              {job.invoice ? (
                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                  <p className="font-medium text-green-600">INV-{job.invoice}</p>
                  <p className="text-xs text-muted-foreground">Generated</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Parts</span>
                    <span>$690</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labor (2 hrs)</span>
                    <span>$180</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>$870</span>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <DollarSign className="h-4 w-4" />
                    Generate Invoice
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Notes</h3>
                <button className="text-xs text-primary hover:underline">Add Note</button>
              </div>
              <div className="space-y-3">
                {job.notes.map((note, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{note.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
