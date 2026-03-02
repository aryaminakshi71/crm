import { Button } from "@crm/ui";
import { Link, useNavigate } from "@tanstack/react-router";

interface HeaderProps {
  showTryDemo?: boolean;
}

export function Header({ showTryDemo = true }: HeaderProps) {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    const demoUserData = {
      id: "demo-user-" + Date.now(),
      email: "demo@nucleo.one",
      name: "Demo User",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      companyId: "demo-company",
      isDemo: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("user", JSON.stringify(demoUserData));
    localStorage.setItem("isDemo", "true");
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem("accessToken", "demo-token");
    localStorage.setItem("companyId", "demo-company");
    navigate({ to: "/app" });
  };

  return (
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="font-bold text-2xl text-primary">
            Nucleo One
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/pricing" className="font-medium text-muted-foreground text-sm hover:text-foreground">
              Pricing
            </Link>
            <Link to="/blog" className="font-medium text-muted-foreground text-sm hover:text-foreground">
              Blog
            </Link>
            <Link to="/docs" className="font-medium text-muted-foreground text-sm hover:text-foreground">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            {showTryDemo && (
              <Button
                variant="outline"
                onClick={handleTryDemo}
                className="border-border text-foreground hover:bg-muted"
              >
                Try Demo
              </Button>
            )}
            <Link to="/register">
              <Button
                variant="primary"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
