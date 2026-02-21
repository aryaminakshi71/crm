/**
 * Projects Route
 *
 * Project management dashboard.
 */

import { Button, Card, CardContent, EmptyState } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Plus } from "lucide-react";

export const Route = createFileRoute("/app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  // Placeholder data - connect to API later
  const projects: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Manage your ongoing projects and tasks.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No projects yet"
          description="Get started by creating your first project."
          action={{ label: "Create Project", onClick: () => {} }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Project cards would go here */}
          <Card>
            <CardContent>Project Content</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
