import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/contacts")({
  beforeLoad: () => {
    throw redirect({ to: "/app/crm/contacts" });
  },
  component: () => null,
});
