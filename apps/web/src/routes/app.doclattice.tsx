import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/doclattice")({
  beforeLoad: () => {
    throw redirect({ to: "/app/assets" });
  },
  component: () => null,
});
