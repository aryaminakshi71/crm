import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  UserCheck,
  UserX,
  ShieldCheck,
  Calendar,
  X,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const MOCK_USERS = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@acmecorp.com",
    organization: "Acme Corporation",
    role: "admin",
    status: "active",
    lastActive: "2026-03-24",
    createdAt: "2025-06-15",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@acmecorp.com",
    organization: "Acme Corporation",
    role: "member",
    status: "active",
    lastActive: "2026-03-23",
    createdAt: "2025-07-02",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@techstart.io",
    organization: "TechStart Inc",
    role: "admin",
    status: "active",
    lastActive: "2026-03-24",
    createdAt: "2025-09-22",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@techstart.io",
    organization: "TechStart Inc",
    role: "viewer",
    status: "active",
    lastActive: "2026-03-20",
    createdAt: "2025-10-14",
  },
  {
    id: "5",
    name: "Eva Martinez",
    email: "eva@globalsolutions.com",
    organization: "Global Solutions Ltd",
    role: "admin",
    status: "suspended",
    lastActive: "2026-03-10",
    createdAt: "2025-08-10",
  },
  {
    id: "6",
    name: "Frank Lee",
    email: "frank@globalsolutions.com",
    organization: "Global Solutions Ltd",
    role: "member",
    status: "active",
    lastActive: "2026-03-22",
    createdAt: "2025-08-18",
  },
  {
    id: "7",
    name: "Grace Kim",
    email: "grace@startuplabs.dev",
    organization: "Startup Labs",
    role: "admin",
    status: "active",
    lastActive: "2026-03-24",
    createdAt: "2026-03-05",
  },
  {
    id: "8",
    name: "Henry Park",
    email: "henry@enterpriseco.com",
    organization: "Enterprise Co",
    role: "member",
    status: "active",
    lastActive: "2026-03-19",
    createdAt: "2025-03-01",
  },
  {
    id: "9",
    name: "Isla Chen",
    email: "isla@enterpriseco.com",
    organization: "Enterprise Co",
    role: "viewer",
    status: "suspended",
    lastActive: "2026-02-28",
    createdAt: "2025-05-14",
  },
  {
    id: "10",
    name: "James Wilson",
    email: "james@digitalagency.pro",
    organization: "Digital Agency Pro",
    role: "admin",
    status: "active",
    lastActive: "2026-03-23",
    createdAt: "2025-11-30",
  },
];

const ORGANIZATIONS = [
  "Acme Corporation",
  "TechStart Inc",
  "Global Solutions Ltd",
  "Startup Labs",
  "Enterprise Co",
  "Digital Agency Pro",
];

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  member: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function InviteUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [org, setOrg] = useState(ORGANIZATIONS[0]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Invite User</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Role
            </label>
            <select
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Organization
            </label>
            <select
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
            >
              {ORGANIZATIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // In production this would call POST /api/admin/users/invite
              onClose();
            }}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Send Invite
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: apiData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return null;
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const users = (apiData as any)?.data ?? [];

  const filtered = users.filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.organization.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === "active").length;
  const adminUsers = users.filter((u: any) => u.role === "admin").length;
  const now = new Date();
  const thisMonth = users.filter((u: any) => {
    const created = new Date(u.createdAt);
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Users className="h-7 w-7" />
            Users
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage all platform users across organizations
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  Total Users
                </p>
                <p className="font-black text-3xl text-foreground mt-1">
                  {totalUsers}
                </p>
              </div>
              <Users className="h-9 w-9 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  Active
                </p>
                <p className="font-black text-3xl text-green-600 mt-1">
                  {activeUsers}
                </p>
              </div>
              <UserCheck className="h-9 w-9 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  Admins
                </p>
                <p className="font-black text-3xl text-purple-600 mt-1">
                  {adminUsers}
                </p>
              </div>
              <ShieldCheck className="h-9 w-9 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  New This Month
                </p>
                <p className="font-black text-3xl text-blue-600 mt-1">
                  {thisMonth}
                </p>
              </div>
              <Calendar className="h-9 w-9 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(user.name)}`}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.organization}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role] ?? ""}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status] ?? ""}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastActive}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        title="Impersonate user"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Impersonate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                        title={
                          user.status === "active" ? "Suspend user" : "Reactivate user"
                        }
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        {user.status === "active" ? "Suspend" : "Reactivate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No users found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
