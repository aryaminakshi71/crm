import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/deals")({
  beforeLoad: () => {
    throw redirect({ to: "/app/crm" });
  },
  component: () => null,
});
