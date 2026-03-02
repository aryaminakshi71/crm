import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/queue")({
  beforeLoad: () => {
    throw redirect({ to: "/app/helpdesk" });
  },
  component: () => null,
});
