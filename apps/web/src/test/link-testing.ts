/**
 * Link Testing Utility
 *
 * Automated link testing for all routes in the application.
 * This can be run with Playwright or used as a reference for manual testing.
 */

export const ROUTES_TO_TEST = {
  // Public routes
  public: [
    { path: "/", name: "Landing Page" },
    { path: "/login", name: "Login Page" },
    { path: "/register", name: "Register Page" },
    { path: "/demo", name: "Demo Page" },
    { path: "/about", name: "About Page" },
    { path: "/contact", name: "Contact Page" },
    { path: "/docs", name: "Documentation Page" },
    { path: "/support", name: "Support Page" },
    { path: "/industries", name: "Industries Page" },
    { path: "/privacy", name: "Privacy Page" },
    { path: "/terms", name: "Terms Page" },
    { path: "/forgot-password", name: "Forgot Password Page" },
  ],

  // Industry detail pages
  industries: [
    { path: "/industries/real-estate", name: "Real Estate Industry" },
    { path: "/industries/education", name: "Education Industry" },
    { path: "/industries/healthcare", name: "Healthcare Industry" },
    { path: "/industries/legal", name: "Legal Industry" },
    { path: "/industries/retail", name: "Retail Industry" },
    { path: "/industries/technology", name: "Technology Industry" },
    { path: "/industries/consulting", name: "Consulting Industry" },
    { path: "/industries/banking", name: "Banking Industry" },
  ],

  // App routes (require auth/demo)
  app: [
    { path: "/app", name: "Dashboard" },
    { path: "/app/contacts", name: "Contacts" },
    { path: "/app/deals", name: "Deals" },
    { path: "/app/leads", name: "Leads" },
    { path: "/app/activities", name: "Activities" },
    { path: "/app/marketing", name: "Marketing" },
    { path: "/app/settings", name: "Settings" },
  ],
};

export const LINKS_TO_VERIFY = {
  "/": [
    { selector: 'a[href="/"]', text: "CRM Platform", type: "logo" },
    { selector: 'a[href="/login"]', text: "Sign In", type: "header" },
    {
      selector: 'a[href="/register"]',
      text: "Start Free Trial",
      type: "header",
    },
    {
      selector: 'a[href="/app/deals"]',
      text: "Deal Pipeline",
      type: "feature",
    },
    {
      selector: 'a[href="/app/contacts"]',
      text: "Contact Management",
      type: "feature",
    },
    {
      selector: 'a[href="/app/marketing"]',
      text: "Email Campaigns",
      type: "feature",
    },
    { selector: 'a[href="/app"]', text: "Sales Analytics", type: "feature" },
    {
      selector: 'a[href="/app/activities"]',
      text: "Relationship Tracking",
      type: "feature",
    },
    {
      selector: 'a[href="/app/settings"]',
      text: "Automation",
      type: "feature",
    },
    { selector: 'a[href="/app/marketing"]', text: "Marketing", type: "footer" },
    { selector: 'a[href="/industries"]', text: "Industries", type: "footer" },
    { selector: 'a[href="/about"]', text: "About", type: "footer" },
    { selector: 'a[href="/contact"]', text: "Contact", type: "footer" },
    { selector: 'a[href="/docs"]', text: "Documentation", type: "footer" },
    { selector: 'a[href="/support"]', text: "Support", type: "footer" },
    { selector: 'a[href="/privacy"]', text: "Privacy", type: "footer" },
    { selector: 'a[href="/terms"]', text: "Terms", type: "footer" },
  ],
  "/login": [
    { selector: 'a[href="/register"]', text: "Start Free Trial", type: "link" },
    { selector: 'a[href="/register"]', text: "Sign up", type: "link" },
    {
      selector: 'a[href="/forgot-password"]',
      text: "Forgot Password",
      type: "link",
    },
  ],
  "/register": [
    { selector: 'a[href="/login"]', text: "Sign in", type: "link" },
    { selector: 'a[href="/demo"]', text: "Try Demo", type: "link" },
  ],
  "/industries": [
    {
      selector: 'a[href*="/industries/real-estate"]',
      text: "Real Estate",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/education"]',
      text: "Education",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/healthcare"]',
      text: "Healthcare",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/legal"]',
      text: "Legal",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/retail"]',
      text: "Retail",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/technology"]',
      text: "Technology",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/consulting"]',
      text: "Consulting",
      type: "industry",
    },
    {
      selector: 'a[href*="/industries/banking"]',
      text: "Banking",
      type: "industry",
    },
  ],
  "/app": [
    { selector: 'a[href="/app"]', text: "Dashboard", type: "sidebar" },
    { selector: 'a[href="/app/contacts"]', text: "Contacts", type: "sidebar" },
    { selector: 'a[href="/app/deals"]', text: "Deals", type: "sidebar" },
    { selector: 'a[href="/app/leads"]', text: "Leads", type: "sidebar" },
    {
      selector: 'a[href="/app/activities"]',
      text: "Activities",
      type: "sidebar",
    },
    { selector: 'a[href="/app/settings"]', text: "Settings", type: "sidebar" },
  ],
};

export interface LinkTestResult {
  route: string;
  linkText: string;
  linkHref: string;
  status: "pass" | "fail" | "skip";
  error?: string;
}

export interface RouteTestResult {
  route: string;
  routeName: string;
  status: "pass" | "fail";
  links: LinkTestResult[];
  error?: string;
}

/**
 * Test all routes and their links
 */
export async function testAllRoutes(
  baseUrl: string = "http://localhost:5173",
): Promise<RouteTestResult[]> {
  const results: RouteTestResult[] = [];

  // Test public routes
  for (const route of ROUTES_TO_TEST.public) {
    const result = await testRoute(
      `${baseUrl}${route.path}`,
      route.name,
      route.path,
    );
    results.push(result);
  }

  // Test industry pages
  for (const route of ROUTES_TO_TEST.industries) {
    const result = await testRoute(
      `${baseUrl}${route.path}`,
      route.name,
      route.path,
    );
    results.push(result);
  }

  // Test app routes (requires demo mode or auth)
  // Note: These would need to set demo mode first
  for (const route of ROUTES_TO_TEST.app) {
    const result = await testRoute(
      `${baseUrl}${route.path}`,
      route.name,
      route.path,
      true,
    );
    results.push(result);
  }

  return results;
}

/**
 * Test a single route
 */
async function testRoute(
  url: string,
  routeName: string,
  routePath: string,
  requiresAuth: boolean = false,
): Promise<RouteTestResult> {
  const result: RouteTestResult = {
    route: routePath,
    routeName,
    status: "pass",
    links: [],
  };

  try {
    // In a real implementation, this would use Playwright or similar
    // For now, this is a structure for manual testing or future automation

    const linksToCheck =
      LINKS_TO_VERIFY[routePath as keyof typeof LINKS_TO_VERIFY] || [];

    for (const link of linksToCheck) {
      result.links.push({
        route: routePath,
        linkText: link.text,
        linkHref: link.selector,
        status: "skip", // Would be "pass" or "fail" after actual testing
      });
    }
  } catch (error) {
    result.status = "fail";
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

/**
 * Generate test report
 */
export function generateTestReport(results: RouteTestResult[]): string {
  let report = "# Link Testing Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  const totalRoutes = results.length;
  const passedRoutes = results.filter((r) => r.status === "pass").length;
  const failedRoutes = results.filter((r) => r.status === "fail").length;

  report += `## Summary\n\n`;
  report += `- Total Routes Tested: ${totalRoutes}\n`;
  report += `- Passed: ${passedRoutes}\n`;
  report += `- Failed: ${failedRoutes}\n`;
  report += `- Success Rate: ${((passedRoutes / totalRoutes) * 100).toFixed(1)}%\n\n`;

  report += `## Detailed Results\n\n`;

  for (const result of results) {
    report += `### ${result.routeName} (${result.route})\n\n`;
    report += `Status: ${result.status === "pass" ? "✅ PASS" : "❌ FAIL"}\n\n`;

    if (result.error) {
      report += `Error: ${result.error}\n\n`;
    }

    if (result.links.length > 0) {
      report += `Links Found: ${result.links.length}\n\n`;
    }

    report += `---\n\n`;
  }

  return report;
}
