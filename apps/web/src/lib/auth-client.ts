import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "", // Use relative URLs - Vite proxy handles /api/* requests
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include", // Important for cookies
  },
});

// export const authClient = {
//   signIn: {
//     email: async () => ({}),
//     social: async () => ({}),
//   },
//   signUp: {
//     email: async () => ({}),
//   },
//   signOut: async () => ({}),
//   useSession: () => ({ data: null }),
//   organization: {
//     create: async () => ({}),
//     list: async () => ({}),
//     setActive: async () => ({}),
//   }
// } as any;

// Export commonly used methods
export const { signIn, signUp, signOut, useSession, organization } = authClient;
