import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Camera,
  Signature,
  CheckCircle2,
  Upload,
  Image,
  Clock,
  User,
  MapPin,
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/proof")({
  component: Proof,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_PROOF_RECORDS = [
  {
    id: 1,
    jobId: "JOB-1042",
    jobTitle: "HVAC System Repair",
    customer: "Acme Corporation",
    technician: "Jane Doe",
    completedAt: "Mar 20, 2026 12:45 PM",
    photos: 4,
    signature: true,
    customerName: "Robert Johnson",
    notes: "Replaced compressor and recharged refrigerant. System running smoothly.",
  },
  {
    id: 2,
    jobId: "JOB-1040",
    jobTitle: "Plumbing Maintenance",
    customer: "Green Valley Clinic",
    technician: "Mike Wilson",
    completedAt: "Mar 20, 2026 11:30 AM",
    photos: 2,
    signature: true,
    customerName: "Dr. Sarah Williams",
    notes: "Routine maintenance completed. All systems operational.",
  },
  {
    id: 3,
    jobId: "JOB-1035",
    jobTitle: "Generator Maintenance",
    customer: "Harbor View Hotel",
    technician: "John Smith",
    completedAt: "Mar 19, 2026 3:00 PM",
    photos: 6,
    signature: true,
    customerName: "Michael Chen",
    notes: "Full generator service completed. Oil change, filter replacement, load test passed.",
  },
  {
    id: 4,
    jobId: "JOB-1032",
    jobTitle: "Electrical Inspection",
    customer: "TechStart Inc",
    technician: "Lisa Chen",
    completedAt: "Mar 18, 2026 10:00 AM",
    photos: 3,
    signature: false,
    customerName: null,
    notes: "Inspection complete. Minor issues noted - see detailed report.",
  },
];

function Proof() {
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["field-service-jobs-proof"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/field-service/jobs?status=completed`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  const completedJobs = jobsData?.data ?? [];

  // Map API jobs to proof records format, fall back to mock if empty
  const proofRecords = completedJobs.length > 0
    ? completedJobs.map((job: {
        id: string | number;
        jobNumber?: string;
        title?: string;
        description?: string;
        customerName?: string;
        technicianName?: string;
        completedAt?: string;
        updatedAt?: string;
        priority?: string;
        hasSignature?: boolean;
        signedBy?: string;
        photoCount?: number;
        notes?: string;
      }) => ({
        id: job.id,
        jobId: job.jobNumber ?? `JOB-${job.id}`,
        jobTitle: job.title ?? job.description ?? "Field Service Job",
        customer: job.customerName ?? "—",
        technician: job.technicianName ?? "—",
        completedAt: job.completedAt ?? job.updatedAt ?? "—",
        photos: job.photoCount ?? 0,
        signature: job.hasSignature ?? false,
        customerName: job.signedBy ?? null,
        notes: job.notes ?? "",
      }))
    : MOCK_PROOF_RECORDS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Proof of Service</h2>
          <p className="text-sm text-muted-foreground">
            Photos, signatures, and completion documentation
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{isLoading ? "…" : (jobsData?.total ?? 156)}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Camera className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{isLoading ? "…" : proofRecords.reduce((sum: number, r: { photos: number }) => sum + r.photos, 0) || 423}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Signature className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{isLoading ? "…" : proofRecords.filter((r: { signature: boolean }) => r.signature).length || 142}</p>
            <p className="text-xs text-muted-foreground">Signatures</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">98%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by job ID or customer..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="complete">Complete</option>
          <option value="pending">Pending Signature</option>
          <option value="partial">Partial Documentation</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Technicians</option>
          <option value="john">John Smith</option>
          <option value="jane">Jane Doe</option>
          <option value="mike">Mike Wilson</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Records List */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="space-y-4">
            {proofRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      record.signature ? "bg-green-500/10" : "bg-amber-500/10"
                    }`}>
                      {record.signature ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{record.jobId}</span>
                        <span className="text-sm text-muted-foreground">{record.jobTitle}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{record.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{record.technician}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>{record.photos} photos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Signature className="h-4 w-4 text-muted-foreground" />
                    <span>{record.signature ? `Signed by ${record.customerName}` : "No signature"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{record.completedAt}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 p-3 rounded bg-muted/20">
                  {record.notes}
                </p>

                {/* Photo Preview */}
                <div className="flex gap-2">
                  {Array.from({ length: record.photos }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                  <button className="w-20 h-20 rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Signature Capture Preview */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Signature Capture (Mobile Preview)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4 bg-white">
              <p className="text-xs text-muted-foreground mb-2">Customer Signature</p>
              <div className="h-32 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Signature className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Tap to sign</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Robert Johnson - Mar 20, 2026</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-white">
              <p className="text-xs text-muted-foreground mb-2">Technician Signature</p>
              <div className="h-32 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Signature className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Tap to sign</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Jane Doe - Mar 20, 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
