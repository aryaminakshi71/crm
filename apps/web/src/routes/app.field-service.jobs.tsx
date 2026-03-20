import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/field-service/jobs")({
  component: FieldServiceJobs,
});

function FieldServiceJobs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Service Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Manage all service jobs and work orders
          </p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="rounded-lg border border-border/60 bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Job #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Technician
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="px-4 py-3 text-sm text-foreground">JOB-001</td>
              <td className="px-4 py-3 text-sm text-foreground">HVAC Repair</td>
              <td className="px-4 py-3 text-sm text-foreground">Acme Corp</td>
              <td className="px-4 py-3 text-sm text-foreground">John Smith</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500">
                  Scheduled
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                  High
                </span>
              </td>
            </tr>
            <tr className="border-b border-border/40">
              <td className="px-4 py-3 text-sm text-foreground">JOB-002</td>
              <td className="px-4 py-3 text-sm text-foreground">Plumbing Check</td>
              <td className="px-4 py-3 text-sm text-foreground">TechStart Inc</td>
              <td className="px-4 py-3 text-sm text-foreground">Jane Doe</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                  In Progress
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500">
                  Medium
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
