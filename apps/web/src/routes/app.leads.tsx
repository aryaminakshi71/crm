/**
 * Leads Route
 *
 * Lead management page.
 */

import { Pagination } from "@/components/pagination";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Plus, Search, UserPlus, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { leadsApi } from "../lib/api";

export const Route = createFileRoute("/app/leads")({
  component: LeadsPage,
});

const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "social_media", label: "Social Media" },
  { value: "event", label: "Event" },
  { value: "advertising", label: "Advertising" },
  { value: "other", label: "Other" },
];

function LeadsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [newLead, setNewLead] = useState({
    email: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    source: "website",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads", currentPage],
    queryFn: () => leadsApi.list({ page: currentPage, limit: itemsPerPage }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newLead) => {
      // Validate required fields
      if (!data.email.trim()) {
        throw new Error("Email is required");
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        throw new Error("Please enter a valid email address");
      }
      return leadsApi.create({
        email: data.email.trim(),
        firstName: data.firstName.trim() || undefined,
        lastName: data.lastName.trim() || undefined,
        companyName: data.companyName.trim() || undefined,
        phone: data.phone.trim() || undefined,
        source: data.source,
        notes: data.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Lead created successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsModalOpen(false);
      setNewLead({
        email: "",
        firstName: "",
        lastName: "",
        companyName: "",
        phone: "",
        source: "website",
        notes: "",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create lead";
      toast.error(errorMessage);
      console.error("Lead creation error:", error);
    },
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      leadsApi.convert(id, data),
    onSuccess: () => {
      toast.success("Lead converted to contact");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const leads = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages =
    data?.total && data?.limit ? Math.ceil(data.total / data.limit) : 1;

  // Client-side filtering for search
  const filteredLeads = leads.filter((lead: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.firstName?.toLowerCase().includes(searchLower) ||
      lead.lastName?.toLowerCase().includes(searchLower) ||
      lead.companyName?.toLowerCase().includes(searchLower)
    );
  });

  const leadCounts = {
    new: leads.filter((l: any) => l.status === "new").length,
    contacted: leads.filter((l: any) => l.status === "contacted").length,
    qualified: leads.filter((l: any) => l.status === "qualified").length,
    converted: leads.filter((l: any) => l.status === "converted").length,
  };

  if (isLoading) {
    return <Loading text="Loading leads..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Leads</h1>
          <p className="text-muted-foreground">Capture and manage leads</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">New</p>
            <p className="font-bold text-2xl text-primary">{leadCounts.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Contacted</p>
            <p className="font-bold text-2xl text-warning">
              {leadCounts.contacted}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Qualified</p>
            <p className="font-bold text-2xl text-success">
              {leadCounts.qualified}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Converted</p>
            <p className="font-bold text-2xl text-primary">
              {leadCounts.converted}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <EmptyState
          icon={<Webhook className="h-12 w-12" />}
          title="No leads yet"
          description="Start capturing leads by adding your first one."
          action={{ label: "Add Lead", onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {lead.firstName} {lead.lastName}
                          {lead.companyName && (
                            <span className="text-muted-foreground">
                              {" "}
                              at {lead.companyName}
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {lead.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          lead.status === "converted"
                            ? "success"
                            : lead.status === "qualified"
                              ? "primary"
                              : "default"
                        }
                      >
                        {lead.status}
                      </Badge>
                      <Badge variant="outline">{lead.source}</Badge>
                      {lead.status !== "converted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<UserPlus className="h-4 w-4" />}
                          onClick={() =>
                            convertMutation.mutate({
                              id: lead.id,
                              data: {
                                firstName: lead.firstName || "Unknown",
                                lastName: lead.lastName || "",
                                companyName: lead.companyName,
                              },
                            })
                          }
                          loading={convertMutation.isPending}
                        >
                          Convert
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* Create Lead Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newLead);
        }}
        title="Add New Lead"
        submitText="Create Lead"
        loading={createMutation.isPending}
      >
        <div className="space-y-4">
          <FormField label="Email" required>
            <Input
              type="email"
              value={newLead.email}
              onChange={(e) =>
                setNewLead({ ...newLead, email: e.target.value })
              }
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name">
              <Input
                value={newLead.firstName}
                onChange={(e) =>
                  setNewLead({ ...newLead, firstName: e.target.value })
                }
              />
            </FormField>
            <FormField label="Last Name">
              <Input
                value={newLead.lastName}
                onChange={(e) =>
                  setNewLead({ ...newLead, lastName: e.target.value })
                }
              />
            </FormField>
          </div>
          <FormField label="Company">
            <Input
              value={newLead.companyName}
              onChange={(e) =>
                setNewLead({ ...newLead, companyName: e.target.value })
              }
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newLead.phone}
              onChange={(e) =>
                setNewLead({ ...newLead, phone: e.target.value })
              }
            />
          </FormField>
          <FormField label="Source">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newLead.source}
              onChange={(e) =>
                setNewLead({ ...newLead, source: e.target.value })
              }
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
