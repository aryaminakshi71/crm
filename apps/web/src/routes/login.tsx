import { authClient } from "@/lib/auth-client";
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/login";
    return {
      meta: [
        { title: "CRM Platform - Login" },
        { name: "description", content: "Log in to CRM Platform." },
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: "CRM Platform - Login" },
        { property: "og:description", content: "Log in to CRM Platform." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "CRM Platform - Login" },
        { name: "twitter:description", content: "Log in to CRM Platform." },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const searchParams = new URLSearchParams(router.state.location.search);
  const redirect = searchParams.get("redirect") || undefined;
  const [email, setEmail] = useState("demo@crm.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      // const result = { error: { message: "Auth disabled" } };

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Clear demo mode flags on successful login
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("isDemo");
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("companyId");

      // Successful login - redirect
      const redirectPath = redirect || "/app";
      navigate({ to: redirectPath });
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        if (
          err.message.includes("fetch") ||
          err.message.includes("Failed to fetch")
        ) {
          setError(
            "Cannot connect to server. Please make sure the API server is running on port 3001.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link to="/" className="flex justify-center">
            <h1 className="font-bold text-3xl text-primary">CRM Platform</h1>
          </Link>
          <h2 className="mt-6 text-center font-extrabold text-3xl text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-muted-foreground text-sm">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Demo Credentials
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between rounded border border-border bg-muted p-2">
              <span className="text-muted-foreground">Email</span>
              <code className="font-mono text-primary">demo@crm.com</code>
            </div>
            <div className="flex items-center justify-between rounded border border-border bg-muted p-2">
              <span className="text-muted-foreground">Password</span>
              <code className="font-mono text-primary">password</code>
            </div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-medium text-foreground text-sm"
              >
                Email address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-border py-2 pr-3 pl-10 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-ring"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-foreground text-sm"
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-border py-2 pr-3 pl-10 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary hover:text-primary"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-3 font-medium text-primary-foreground text-sm shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-border border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-muted px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg border border-border bg-card px-4 py-2.5 font-medium text-muted-foreground text-sm shadow-sm hover:bg-muted"
              onClick={() => authClient.signIn.social({ provider: "google" })}
            // // onClick={() => authClient.signIn.social({ provider: "google" })}
            >
              <span className="sr-only">Sign in with Google</span>
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.1-1.133 7.973-3.007 1.92-1.92 2.507-4.8 2.507-7.147 0-.64-.067-1.253-.187-1.84h-10.293z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg border border-border bg-card px-4 py-2.5 font-medium text-muted-foreground text-sm shadow-sm hover:bg-muted"
              onClick={() => authClient.signIn.social({ provider: "github" })}
            // // onClick={() => authClient.signIn.social({ provider: "github" })}
            >
              <span className="sr-only">Sign in with GitHub</span>
              <svg
                className="h-5 w-5"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div>
            <Link
              to="/demo"
              className="flex w-full justify-center rounded-lg border-2 border-border bg-card px-4 py-3 font-medium text-foreground text-sm shadow-sm hover:bg-muted"
            >
              Try Demo Instead
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
