import { authClient } from "@/lib/auth-client";
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Lock, LogIn, Mail, User } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/register";
    return {
      meta: [
        { title: "CRM Platform - Register" },
        { name: "description", content: "Create your CRM Platform account." },
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: "CRM Platform - Register" },
        {
          property: "og:description",
          content: "Create your CRM Platform account.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "CRM Platform - Register" },
        {
          name: "twitter:description",
          content: "Create your CRM Platform account.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const searchParams = new URLSearchParams(router.state.location.search);
  const redirect = searchParams.get("redirect") || undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Clear demo mode flags on successful registration
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("isDemo");
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("companyId");

      // Successful registration - redirect to dashboard or specified path
      const redirectPath = redirect || "/app";
      navigate({ to: redirectPath });
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary"
            >
              Sign in
            </Link>
          </p>
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
                htmlFor="name"
                className="block font-medium text-foreground text-sm"
              >
                Full Name
              </label>
              <div className="relative mt-1">
                <User className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-border py-2 pr-3 pl-10 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-ring"
                  placeholder="John Doe"
                />
              </div>
            </div>
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-border py-2 pr-3 pl-10 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
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
                  Creating account...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-border border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-muted px-2 text-muted-foreground">Or</span>
            </div>
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
