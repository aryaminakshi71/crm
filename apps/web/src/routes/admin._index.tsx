import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_index")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/organizations" });
  },
});
