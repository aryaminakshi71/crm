/**
 * CRM Document Generation
 *
 * Document templates and generation for sales collateral.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/documents")({
  component: DocumentGeneration,
});

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: "proposal" | "contract" | "quote" | "presentation" | "report";
  category: string;
  lastUsed: string;
  usageCount: number;
  estimatedTime: string;
}

interface GeneratedDocument {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  status: "draft" | "sent" | "signed" | "expired";
  recipient: string;
  deals?: string;
}

const mockTemplates: DocumentTemplate[] = [
  {
    id: "1",
    name: "Enterprise Proposal",
    description: "Comprehensive proposal template for enterprise deals with pricing tiers",
    type: "proposal",
    category: "Sales",
    lastUsed: "2024-03-15",
    usageCount: 45,
    estimatedTime: "10 min",
  },
  {
    id: "2",
    name: "Master Services Agreement",
    description: "Legal contract template with standard terms and conditions",
    type: "contract",
    category: "Legal",
    lastUsed: "2024-03-10",
    usageCount: 28,
    estimatedTime: "5 min",
  },
  {
    id: "3",
    name: "Sales Quote",
    description: "Quick quote template with line items and pricing",
    type: "quote",
    category: "Sales",
    lastUsed: "2024-03-18",
    usageCount: 67,
    estimatedTime: "3 min",
  },
  {
    id: "4",
    name: "Product Demo Deck",
    description: "Interactive presentation with product screenshots and features",
    type: "presentation",
    category: "Marketing",
    lastUsed: "2024-03-19",
    usageCount: 89,
    estimatedTime: "5 min",
  },
  {
    id: "5",
    name: "ROI Analysis Report",
    description: "Automated ROI calculator report with customer data",
    type: "report",
    category: "Sales",
    lastUsed: "2024-03-14",
    usageCount: 34,
    estimatedTime: "8 min",
  },
  {
    id: "6",
    name: "Partnership Agreement",
    description: "Template for partnership and reseller agreements",
    type: "contract",
    category: "Legal",
    lastUsed: "2024-02-28",
    usageCount: 12,
    estimatedTime: "7 min",
  },
];

const mockDocuments: GeneratedDocument[] = [
  {
    id: "1",
    name: "Enterprise SaaS License - Acme Corp",
    template: "Enterprise Proposal",
    createdAt: "2024-03-15",
    status: "signed",
    recipient: "John Smith",
    deals: "Enterprise SaaS License",
  },
  {
    id: "2",
    name: "Cloud Migration Quote - TechStart",
    template: "Sales Quote",
    createdAt: "2024-03-14",
    status: "sent",
    recipient: "Sarah Johnson",
    deals: "Cloud Migration Project",
  },
  {
    id: "3",
    name: "Platform Integration Proposal",
    template: "Enterprise Proposal",
    createdAt: "2024-03-10",
    status: "draft",
    recipient: "Emily Wong",
    deals: "Platform Integration",
  },
  {
    id: "4",
    name: "Annual Support Contract",
    template: "Master Services Agreement",
    createdAt: "2024-03-01",
    status: "signed",
    recipient: "David Park",
    deals: "Annual Support Contract",
  },
  {
    id: "5",
    name: "Data Analytics Suite Quote",
    template: "Sales Quote",
    createdAt: "2024-02-25",
    status: "expired",
    recipient: "Jennifer Lee",
    deals: "Data Analytics Suite",
  },
];

function DocumentGeneration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"templates" | "documents">("templates");

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || template.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const typeIcons: Record<string, React.ReactNode> = {
    proposal: <FileText className="h-5 w-5 text-blue-600" />,
    contract: <FileText className="h-5 w-5 text-purple-600" />,
    quote: <FileText className="h-5 w-5 text-green-600" />,
    presentation: <FileText className="h-5 w-5 text-orange-600" />,
    report: <FileText className="h-5 w-5 text-cyan-600" />,
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    signed: "bg-green-100 text-green-700 border-green-200",
    expired: "bg-red-100 text-red-700 border-red-200",
  };

  const stats = {
    totalTemplates: mockTemplates.length,
    totalDocuments: mockDocuments.length,
    signedThisMonth: mockDocuments.filter((d) => d.status === "signed").length,
    pendingSignatures: mockDocuments.filter((d) => d.status === "sent").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="proposal">Proposals</option>
            <option value="contract">Contracts</option>
            <option value="quote">Quotes</option>
            <option value="presentation">Presentations</option>
            <option value="report">Reports</option>
          </select>
        </div>
        <Button onClick={() => toast.info("Template editor coming soon")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "templates"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Templates ({mockTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Generated Documents ({mockDocuments.length})
          </button>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Templates</p>
                <p className="font-bold text-2xl">{stats.totalTemplates}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Documents</p>
                <p className="font-bold text-2xl">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Signed (MTD)</p>
                <p className="font-bold text-2xl text-green-600">{stats.signedThisMonth}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Pending</p>
                <p className="font-bold text-2xl text-yellow-600">{stats.pendingSignatures}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.length === 0 ? (
            <Card className="border-border/60 md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => toast.info(`Opening ${template.name} editor`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-lg bg-muted p-3">
                      {typeIcons[template.type]}
                    </div>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {template.usageCount} uses
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Preview coming soon");
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Document created from template");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Document
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Template
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Recipient
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="w-24 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            {doc.deals && (
                              <p className="text-xs text-muted-foreground">Deal: {doc.deals}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{doc.template}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{doc.recipient}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={statusColors[doc.status]}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{doc.createdAt}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.status === "draft" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
