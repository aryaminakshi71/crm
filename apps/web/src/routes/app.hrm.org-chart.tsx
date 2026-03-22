import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  Mail,
  Maximize2,
  Phone,
  Search,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm/org-chart")({
  component: OrgChart,
});

interface OrgNode {
  id: string;
  name: string;
  role: string;
  dept: string;
  avatar: string;
  email: string;
  phone: string;
  children?: OrgNode[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Build an OrgNode tree from a flat list of employees */
function buildOrgTree(employees: any[]): OrgNode | null {
  if (employees.length === 0) return null;

  // Map by fullName for manager lookup
  const byName = new Map<string, any>();
  for (const emp of employees) {
    byName.set((emp.fullName ?? "").toLowerCase(), emp);
  }

  const nodes: Map<string, OrgNode> = new Map();
  for (const emp of employees) {
    nodes.set(emp.id, {
      id: emp.id,
      name: emp.fullName ?? emp.name ?? "Unknown",
      role: emp.jobTitle ?? "Employee",
      dept: emp.department ?? "General",
      avatar: getInitials(emp.fullName ?? emp.name ?? "?"),
      email: emp.workEmail ?? emp.email ?? "",
      phone: emp.phone ?? "",
      children: [],
    });
  }

  const roots: OrgNode[] = [];
  for (const emp of employees) {
    const node = nodes.get(emp.id)!;
    const managerName = (emp.managerName ?? "").toLowerCase().trim();
    if (!managerName) {
      roots.push(node);
      continue;
    }
    const manager = byName.get(managerName);
    if (manager && nodes.has(manager.id)) {
      nodes.get(manager.id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // If multiple roots, wrap in a virtual node
  if (roots.length === 1) return roots[0];
  if (roots.length === 0) return null;

  return {
    id: "__org_root__",
    name: "Organization",
    role: "",
    dept: "",
    avatar: "ORG",
    email: "",
    phone: "",
    children: roots,
  };
}

function OrgChart() {
    {
      id: "cto",
      name: "David Park",
      role: "Chief Technology Officer",
      dept: "Technology",
      avatar: "DP",
      email: "david.park@nucleo.one",
      phone: "+1 (555) 100-0002",
      children: [
        {
          id: "eng-dir",
          name: "Sarah Chen",
          role: "VP of Engineering",
          dept: "Engineering",
          avatar: "SC",
          email: "sarah.chen@nucleo.one",
          phone: "+1 (555) 100-0003",
          children: [
            {
              id: "eng-1",
              name: "Jessica Lee",
              role: "Engineering Manager",
              dept: "Engineering",
              avatar: "JL",
              email: "jessica.lee@nucleo.one",
              phone: "+1 (555) 100-0004",
            },
            {
              id: "eng-2",
              name: "Chris Martinez",
              role: "Engineering Manager",
              dept: "Engineering",
              avatar: "CM",
              email: "chris.martinez@nucleo.one",
              phone: "+1 (555) 100-0005",
            },
          ],
        },
        {
          id: "product-dir",
          name: "Emily Watson",
          role: "VP of Product",
          dept: "Product",
          avatar: "EW",
          email: "emily.watson@nucleo.one",
          phone: "+1 (555) 100-0006",
          children: [
            {
              id: "product-1",
              name: "Marcus Johnson",
              role: "Senior Product Manager",
              dept: "Product",
              avatar: "MJ",
              email: "marcus.johnson@nucleo.one",
              phone: "+1 (555) 100-0007",
            },
          ],
        },
      ],
    },
    {
      id: "cfo",
      name: "Robert Martinez",
      role: "Chief Financial Officer",
      dept: "Finance",
      avatar: "RM",
      email: "robert.martinez@nucleo.one",
      phone: "+1 (555) 100-0008",
      children: [
        {
          id: "finance-1",
          name: "Lisa Anderson",
          role: "Finance Manager",
          dept: "Finance",
          avatar: "LA",
          email: "lisa.anderson@nucleo.one",
          phone: "+1 (555) 100-0009",
        },
      ],
    },
    {
      id: "cmo",
      name: "Sarah Miller",
      role: "Chief Marketing Officer",
      dept: "Marketing",
      avatar: "SM",
      email: "sarah.miller@nucleo.one",
      phone: "+1 (555) 100-0010",
      children: [
        {
          id: "marketing-1",
          name: "Michael Brown",
          role: "Marketing Manager",
          dept: "Marketing",
          avatar: "MB",
          email: "michael.brown@nucleo.one",
          phone: "+1 (555) 100-0011",
        },
        {
          id: "marketing-2",
          name: "Lisa Wang",
          role: "Content Director",
          dept: "Marketing",
          avatar: "LW",
          email: "lisa.wang@nucleo.one",
          phone: "+1 (555) 100-0012",
        },
      ],
    },
    {
      id: "cso",
      name: "Robert Chen",
      role: "Chief Sales Officer",
      dept: "Sales",
      avatar: "RC",
      email: "robert.chen@nucleo.one",
      phone: "+1 (555) 100-0013",
      children: [
        {
          id: "sales-1",
          name: "David Kim",
          role: "Sales Manager",
          dept: "Sales",
          avatar: "DK",
          email: "david.kim@nucleo.one",
          phone: "+1 (555) 100-0014",
        },
        {
          id: "sales-2",
          name: "James Wilson",
          role: "Account Executive",
          dept: "Sales",
          avatar: "JW",
          email: "james.wilson@nucleo.one",
          phone: "+1 (555) 100-0015",
        },
      ],
    },
    {
      id: "coo",
      name: "Tom Wilson",
      role: "Chief Operating Officer",
      dept: "Operations",
      avatar: "TW",
      email: "tom.wilson@nucleo.one",
      phone: "+1 (555) 100-0016",
      children: [
        {
          id: "ops-1",
          name: "Amanda White",
          role: "HR Director",
          dept: "Operations",
          avatar: "AW",
          email: "amanda.white@nucleo.one",
          phone: "+1 (555) 100-0017",
        },
        {
          id: "ops-2",
          name: "Lisa Park",
          role: "Design Director",
          dept: "Design",
          avatar: "LP",
          email: "lisa.park@nucleo.one",
          phone: "+1 (555) 100-0018",
          children: [
            {
              id: "design-1",
              name: "Emily Rodriguez",
              role: "UX Lead",
              dept: "Design",
              avatar: "ER",
              email: "emily.rodriguez@nucleo.one",
              phone: "+1 (555) 100-0019",
            },
          ],
        },
      ],
    },
  ],
};

function OrgChart() {
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["hrm-employees-org"],
    queryFn: () => nucleoApi.hrm.employees.list({ page: 1, limit: 200 }),
  });

  const orgData = useMemo(() => {
    const employees: any[] = employeesData?.data ?? [];
    return buildOrgTree(employees);
  }, [employeesData]);

  // Auto-expand root on first load
  useMemo(() => {
    if (orgData) {
      setExpandedNodes(new Set([orgData.id]));
    }
  }, [orgData?.id]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    if (!orgData) return;
    const allIds = new Set<string>();
    const collectIds = (node: OrgNode) => {
      allIds.add(node.id);
      node.children?.forEach(collectIds);
    };
    collectIds(orgData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const highlightPath = (node: OrgNode, path: OrgNode[] = []): OrgNode[] => {
    if (!search) return [];
    if (node.name.toLowerCase().includes(search.toLowerCase()) || node.role.toLowerCase().includes(search.toLowerCase())) {
      return path;
    }
    for (const child of node.children || []) {
      const result = highlightPath(child, [...path, node]);
      if (result.length > 0) return result;
    }
    return [];
  };

  const highlightedPath = search && orgData ? highlightPath(orgData) : [];

  const renderNode = (node: OrgNode, level: number = 0, parentPath: OrgNode[] = []) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHighlighted = highlightedPath.includes(node);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          className={`relative flex flex-col items-center ${isHighlighted ? "animate-pulse" : ""}`}
        >
          {/* Connection line to parent */}
          {level > 0 && (
            <div className="absolute w-px h-6 bg-border -top-6" />
          )}

          {/* Node card */}
          <div
            onClick={() => setSelectedNode(node)}
            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
              isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : isHighlighted
                  ? "border-amber-400 bg-amber-500/5"
                  : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm mb-2">
              {node.avatar}
            </div>
            <p className="text-sm font-semibold text-foreground text-center whitespace-nowrap">{node.name}</p>
            <p className="text-xs text-muted-foreground text-center whitespace-nowrap">{node.role}</p>
            <div className="flex items-center gap-1 mt-1 justify-center">
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {node.dept}
              </span>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative mt-4">
            {/* Horizontal line */}
            <div className="absolute left-1/2 -top-4 w-px h-4 bg-border" />

            <div className={`flex gap-8 ${level === 0 ? "pt-4" : ""}`}>
              {node.children!.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical connector */}
                  <div className="w-px h-4 bg-border" />
                  {/* Horizontal connector */}
                  <div className="w-full h-px bg-border" style={{ width: "100%" }} />
                  {renderNode(child, level + 1, [...parentPath, node])}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Organization Chart</h2>
          <p className="text-sm text-muted-foreground">
            Visualize your company structure and reporting lines
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={expandAll}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Collapse All
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex gap-6">
        {/* Chart */}
        <div className="flex-1 rounded-lg border border-border/60 bg-card p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !orgData ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No employees found. Add employees to build the org chart.</p>
            </div>
          ) : (
            <div
              className="min-w-max transition-transform origin-top-left"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {renderNode(orgData)}
            </div>
          )}
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="w-80 rounded-lg border border-border/60 bg-card p-6 h-fit sticky top-6">
            <div className="flex flex-col items-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold mb-3">
                {selectedNode.avatar}
              </div>
              <h3 className="font-semibold text-foreground text-lg">{selectedNode.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedNode.role}</p>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium text-foreground">{selectedNode.dept}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedNode.email}`} className="text-sm text-primary hover:underline">
                    {selectedNode.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${selectedNode.phone}`} className="text-sm text-foreground">
                    {selectedNode.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Direct Reports</p>
                  <p className="text-sm font-medium text-foreground">{selectedNode.children?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <a
                href={`/app/hrm/employees/${selectedNode.id}`}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground text-center hover:bg-muted/50"
              >
                View Profile
              </a>
              <a
                href={`mailto:${selectedNode.email}`}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
