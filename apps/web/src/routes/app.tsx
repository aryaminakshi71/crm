import { AppLayout } from "@/components/layout/app-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  notFoundComponent: () => <div>Page Not Found</div>,
});
