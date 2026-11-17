import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect } from "react";
import "@/styles/globals.css";
import "@/styles/mobile.css";
import { initCapacitor } from "@/lib/mobile";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "DevMind - AI Agents for Developers" },
      { name: "description", content: "Create, deploy, and manage autonomous AI agents. Automate workflows, enhance coding, and boost productivity with DevMind." },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
  }),
  component: RootDocument,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function RootDocument() {
  useEffect(() => {
    initCapacitor();
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Scripts />
        </QueryClientProvider>
      </body>
    </html>
  );
}
