import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  Building2,
  DollarSign,
  Mail,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { aiApi, contactsApi, dealsApi, leadsApi } from "../lib/api";

export const Route = createFileRoute("/app/crm")({
  component: CrmWorkspacePage,
});

type CrmView = "overview" | "contacts" | "leads" | "deals";

const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

function CrmWorkspacePage() {
  const [view, setView] = useState<CrmView>("overview");
  const [search, setSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [dealStageFilter, setDealStageFilter] = useState("all");

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
  });
  const [newLead, setNewLead] = useState({
    email: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    source: "website",
    notes: "",
  });
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "lead",
    notes: "",
  });

  const [leadScores, setLeadScores] = useState<
    Record<string, { score: number; reasoning: string }>
  >({});

  const queryClient = useQueryClient();

  const { data: contactsData, isLoading: isContactsLoading } = useQuery({
    queryKey: ["crm-contacts", search],
    queryFn: () => contactsApi.list({ page: 1, limit: 200, search }),
  });

  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["crm-leads", search, leadStatusFilter],
    queryFn: () =>
      leadsApi.list({
        page: 1,
        limit: 200,
        search,
        status: leadStatusFilter !== "all" ? leadStatusFilter : undefined,
      }),
  });

  const { data: dealsData, isLoading: isDealsLoading } = useQuery({
    queryKey: ["crm-deals", search, dealStageFilter],
    queryFn: () =>
      dealsApi.list({
        search,
        stage: dealStageFilter !== "all" ? dealStageFilter : undefined,
      }),
  });

  const createContact = useMutation({
    mutationFn: () => {
      if (!newContact.firstName.trim() || !newContact.lastName.trim()) {
        throw new Error("First and last name are required");
      }
      return contactsApi.create({
        firstName: newContact.firstName.trim(),
        lastName: newContact.lastName.trim(),
        email: newContact.email.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        companyName: newContact.companyName.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Contact created");
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setIsContactModalOpen(false);
      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
      });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create contact"),
  });

  const createLead = useMutation({
    mutationFn: () => {
      if (!newLead.email.trim()) {
        throw new Error("Lead email is required");
      }
      return leadsApi.create({
        email: newLead.email.trim(),
        firstName: newLead.firstName.trim() || undefined,
        lastName: newLead.lastName.trim() || undefined,
        companyName: newLead.companyName.trim() || undefined,
        phone: newLead.phone.trim() || undefined,
        source: newLead.source,
        notes: newLead.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsLeadModalOpen(false);
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
    onError: (error: Error) => toast.error(error.message || "Failed to create lead"),
  });

  const createDeal = useMutation({
    mutationFn: () => {
      const value = Number(newDeal.value);
      if (!newDeal.name.trim()) {
        throw new Error("Deal name is required");
      }
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Deal value must be a positive number");
      }
      return dealsApi.create({
        name: newDeal.name.trim(),
        value,
        stage: newDeal.stage,
        notes: newDeal.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Deal created");
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setIsDealModalOpen(false);
      setNewDeal({ name: "", value: "", stage: "lead", notes: "" });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create deal"),
  });

  const convertLead = useMutation({
    mutationFn: (leadId: string) => leadsApi.convert(leadId, {}),
    onSuccess: () => {
      toast.success("Lead converted to contact");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to convert lead"),
  });

  const updateDealStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal stage updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update stage"),
  });

  const scoreLead = useMutation({
    mutationFn: (lead: any) =>
      aiApi.scoreLead({
        email: lead.email,
        companyName: lead.companyName,
        notes: lead.notes,
      }),
    onSuccess: (result, lead) => {
      if (!result.result) {
        toast.error("Lead score unavailable");
        return;
      }
      setLeadScores((prev) => ({ ...prev, [lead.id]: result.result! }));
      toast.success(`Lead scored ${result.result.score}/100`);
    },
    onError: () => toast.error("Failed to score lead"),
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const updateContact = useMutation({
    mutationFn: ({
      id,
      companyName,
    }: {
      id: string;
      companyName?: string;
    }) => contactsApi.update(id, { companyName: companyName || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact updated");
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead updated");
    },
    onError: () => toast.error("Failed to update lead"),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Deal deleted");
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  const contacts = (contactsData?.data as any[]) || [];
  const leads = (leadsData?.data as any[]) || [];
  const deals = (dealsData?.data as any[]) || [];

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((contact: any) => {
      return (
        String(contact.firstName || "").toLowerCase().includes(q) ||
        String(contact.lastName || "").toLowerCase().includes(q) ||
        String(contact.email || "").toLowerCase().includes(q) ||
        String(contact.companyName || "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((lead: any) => {
      return (
        String(lead.email || "").toLowerCase().includes(q) ||
        String(lead.firstName || "").toLowerCase().includes(q) ||
        String(lead.lastName || "").toLowerCase().includes(q) ||
        String(lead.companyName || "").toLowerCase().includes(q)
      );
    });
  }, [leads, search]);

  const filteredDeals = useMemo(() => {
    if (!search.trim()) return deals;
    const q = search.toLowerCase();
    return deals.filter((deal: any) => {
      return (
        String(deal.name || "").toLowerCase().includes(q) ||
        String(deal.notes || "").toLowerCase().includes(q) ||
        String(deal.stage || "").toLowerCase().includes(q)
      );
    });
  }, [deals, search]);

  const totalPipeline = deals.reduce(
    (sum: number, deal: any) => sum + Number(deal.value || 0),
    0,
  );
  const wonPipeline = deals
    .filter((deal: any) => deal.stage === "won")
    .reduce((sum: number, deal: any) => sum + Number(deal.value || 0), 0);
  const newLeads = leads.filter((lead: any) => lead.status === "new").length;

  const isLoading = isContactsLoading || isLeadsLoading || isDealsLoading;

  if (isLoading) {
    return <Loading text="Loading CRM workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CRM Workspace</h1>
          <p className="text-muted-foreground">
            Unified contacts, leads, and deals with AI-assisted lead intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsContactModalOpen(true)}
          >
            Contact
          </Button>
          <Button
            variant="outline"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsLeadModalOpen(true)}
          >
            Lead
          </Button>
          <Button
            variant="primary"
            leftIcon={<Target className="h-4 w-4" />}
            onClick={() => setIsDealModalOpen(true)}
          >
            Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          title="Contacts"
          value={contacts.length}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          title="Leads"
          value={leads.length}
          icon={<Mail className="h-5 w-5 text-warning" />}
        />
        <KpiCard
          title="Deals"
          value={deals.length}
          icon={<Target className="h-5 w-5 text-success" />}
        />
        <KpiCard
          title="Pipeline Value"
          value={`$${totalPipeline.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-foreground" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["overview", "Overview"],
          ["contacts", "Contacts"],
          ["leads", "Leads"],
          ["deals", "Deals"],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={view === key ? "primary" : "outline"}
            size="sm"
            onClick={() => setView(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts, leads, or deals..."
          />
        </div>

        {view === "leads" ? (
          <select
            value={leadStatusFilter}
            onChange={(e) => setLeadStatusFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All lead statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
          </select>
        ) : null}

        {view === "deals" ? (
          <select
            value={dealStageFilter}
            onChange={(e) => setDealStageFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All deal stages</option>
            {DEAL_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {view === "overview" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Lead Velocity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">New leads this cycle</p>
              <p className="font-bold text-3xl text-primary">{newLeads}</p>
              <p className="text-muted-foreground">
                Converted leads: {leads.filter((lead: any) => lead.status === "converted").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Closed-won value</p>
              <p className="font-bold text-3xl text-success">
                ${wonPipeline.toLocaleString()}
              </p>
              <p className="text-muted-foreground">Open pipeline: ${Math.max(totalPipeline - wonPipeline, 0).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                leftIcon={<ArrowRightLeft className="h-4 w-4" />}
                onClick={() => setView("leads")}
              >
                Review leads for qualification
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                leftIcon={<Building2 className="h-4 w-4" />}
                onClick={() => setView("contacts")}
              >
                Validate account and contact data
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                leftIcon={<Target className="h-4 w-4" />}
                onClick={() => setView("deals")}
              >
                Advance late-stage opportunities
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "contacts" ? (
        filteredContacts.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No contacts found"
            description="Create contacts and connect them to leads and deals."
            action={{ label: "Add Contact", onClick: () => setIsContactModalOpen(true) }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredContacts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {contact.email || "No email"}
                        {contact.companyName ? ` | ${contact.companyName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">contact</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const nextCompany = window.prompt(
                            "Update company",
                            contact.companyName || "",
                          );
                          if (nextCompany === null) return;
                          updateContact.mutate({
                            id: contact.id,
                            companyName: nextCompany.trim(),
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteContact.mutate(contact.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : null}

      {view === "leads" ? (
        filteredLeads.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No leads found"
            description="Capture leads from campaigns, forms, and outbound channels."
            action={{ label: "Add Lead", onClick: () => setIsLeadModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredLeads.map((lead: any) => (
              <Card key={lead.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {lead.firstName || "-"} {lead.lastName || ""}
                      </p>
                      <p className="text-muted-foreground text-sm">{lead.email}</p>
                      {lead.companyName ? (
                        <p className="text-muted-foreground text-sm">{lead.companyName}</p>
                      ) : null}
                    </div>
                    <Badge
                      variant={
                        lead.status === "converted"
                          ? "success"
                          : lead.status === "qualified"
                            ? "primary"
                            : "outline"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                      value={lead.status || "new"}
                      onChange={(e) =>
                        updateLeadStatus.mutate({ id: lead.id, status: e.target.value })
                      }
                    >
                      <option value="new">new</option>
                      <option value="qualified">qualified</option>
                      <option value="converted">converted</option>
                      <option value="lost">lost</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Sparkles className="h-4 w-4" />}
                      loading={scoreLead.isPending}
                      onClick={() => scoreLead.mutate(lead)}
                    >
                      Score
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<ArrowRightLeft className="h-4 w-4" />}
                      loading={convertLead.isPending}
                      onClick={() => convertLead.mutate(lead.id)}
                    >
                      Convert
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      loading={deleteLead.isPending}
                      onClick={() => deleteLead.mutate(lead.id)}
                    >
                      Delete
                    </Button>
                  </div>

                  {leadScores[lead.id] ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs">
                      <p className="font-medium text-foreground">
                        AI Score: {leadScores[lead.id].score}
                      </p>
                      <p className="text-muted-foreground">{leadScores[lead.id].reasoning}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {view === "deals" ? (
        filteredDeals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="No deals found"
            description="Build a forecastable pipeline from qualified opportunities."
            action={{ label: "Add Deal", onClick: () => setIsDealModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredDeals.map((deal: any) => (
              <Card key={deal.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{deal.name}</p>
                      <p className="text-muted-foreground text-sm">
                        ${Number(deal.value || 0).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={deal.stage === "won" ? "success" : "outline"}>
                      {deal.stage}
                    </Badge>
                  </div>

                  <FormField label="Stage">
                    <select
                      className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      value={deal.stage}
                      onChange={(e) =>
                        updateDealStage.mutate({ id: deal.id, stage: e.target.value })
                      }
                    >
                      {DEAL_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      loading={deleteDeal.isPending}
                      onClick={() => deleteDeal.mutate(deal.id)}
                    >
                      Delete Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <FormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Contact"
        submitText="Create Contact"
        loading={createContact.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createContact.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="First Name" required>
            <Input
              value={newContact.firstName}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Last Name" required>
            <Input
              value={newContact.lastName}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={newContact.email}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newContact.phone}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Company" className="md:col-span-2">
            <Input
              value={newContact.companyName}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, companyName: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title="Add Lead"
        submitText="Create Lead"
        loading={createLead.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createLead.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Email" required>
            <Input
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead((prev) => ({ ...prev, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Source">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newLead.source}
              onChange={(e) => setNewLead((prev) => ({ ...prev, source: e.target.value }))}
            >
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="social_media">Social Media</option>
              <option value="event">Event</option>
            </select>
          </FormField>
          <FormField label="First Name">
            <Input
              value={newLead.firstName}
              onChange={(e) =>
                setNewLead((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              value={newLead.lastName}
              onChange={(e) =>
                setNewLead((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={newLead.companyName}
              onChange={(e) =>
                setNewLead((prev) => ({ ...prev, companyName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newLead.phone}
              onChange={(e) => setNewLead((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </FormField>
          <FormField label="Notes" className="md:col-span-2">
            <Textarea
              rows={3}
              value={newLead.notes}
              onChange={(e) => setNewLead((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        title="Add Deal"
        submitText="Create Deal"
        loading={createDeal.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createDeal.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Deal Name" required>
            <Input
              value={newDeal.name}
              onChange={(e) => setNewDeal((prev) => ({ ...prev, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Value" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newDeal.value}
              onChange={(e) => setNewDeal((prev) => ({ ...prev, value: e.target.value }))}
            />
          </FormField>
          <FormField label="Stage">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newDeal.stage}
              onChange={(e) => setNewDeal((prev) => ({ ...prev, stage: e.target.value }))}
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <Textarea
              rows={3}
              value={newDeal.notes}
              onChange={(e) => setNewDeal((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
