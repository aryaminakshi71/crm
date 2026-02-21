import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

// Hydrate the app using TanStack Start's StartClient
// This properly hydrates the server-rendered HTML
hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
