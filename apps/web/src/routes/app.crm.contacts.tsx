import {
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
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Edit2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { contactsApi } from "../lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/crm/contacts")({
  component: CrmContactsPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function avatarBg(str: string) {
  const colors = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];
  const h = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[h % colors.length];
}

function Avatar({ firstName = "", lastName = "", size = 36 }: { firstName?: string; lastName?: string; size?: number }) {
  const bg = avatarBg(`${firstName}${lastName}`);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CrmContactsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
  });

  const queryClient = useQueryClient();

  // ─── Query ─────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts", search],
    queryFn: () => contactsApi.list({ page: 1, limit: 200, search: search.trim() || undefined }),
  });

  const contacts = (data?.data as any[]) ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c: any) =>
      [c.firstName, c.lastName, c.email, c.companyName].some((v) =>
        String(v || "").toLowerCase().includes(q),
      ),
    );
  }, [contacts, search]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createContact = useMutation({
    mutationFn: () => {
      if (!newContact.firstName.trim() || !newContact.lastName.trim())
        throw new Error("First and last name are required");
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
      setIsCreateOpen(false);
      setNewContact({ firstName: "", lastName: "", email: "", phone: "", companyName: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create contact"),
  });

  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact updated");
      setEditContact(null);
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Contacts</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            Manage your customer and prospect contacts.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Contact
        </Button>
      </div>

      {/* Stats */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Contacts</p>
            <p className="font-black text-2xl text-foreground">{contacts.length}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">
            <Users className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <Loading text="Loading contacts..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description={search ? "Try adjusting your search." : "Create your first contact to get started."}
          action={{ label: "New Contact", onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((contact: any) => (
            <Card key={contact.id} className="border-border/60 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar firstName={contact.firstName} lastName={contact.lastName} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed Contact"}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Mail className="h-3 w-3" />{contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Phone className="h-3 w-3" />{contact.phone}
                        </span>
                      )}
                      {contact.companyName && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Building2 className="h-3 w-3" />{contact.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => setEditContact(contact)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteContact.mutate(contact.id)}
                      disabled={deleteContact.isPending}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Contact"
        onSubmit={() => createContact.mutate()}
        isSubmitting={createContact.isPending}
        submitLabel="Create Contact"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name *">
            <Input
              placeholder="Jane"
              value={newContact.firstName}
              onChange={(e) => setNewContact((p) => ({ ...p, firstName: e.target.value }))}
            />
          </FormField>
          <FormField label="Last Name *">
            <Input
              placeholder="Smith"
              value={newContact.lastName}
              onChange={(e) => setNewContact((p) => ({ ...p, lastName: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Email">
          <Input
            type="email"
            placeholder="jane@example.com"
            value={newContact.email}
            onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            placeholder="+1 555 000 0000"
            value={newContact.phone}
            onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
          />
        </FormField>
        <FormField label="Company">
          <Input
            placeholder="Acme Corp"
            value={newContact.companyName}
            onChange={(e) => setNewContact((p) => ({ ...p, companyName: e.target.value }))}
          />
        </FormField>
      </FormModal>

      {/* Edit Modal */}
      {editContact && (
        <FormModal
          isOpen={!!editContact}
          onClose={() => setEditContact(null)}
          title="Edit Contact"
          onSubmit={() =>
            updateContact.mutate({
              id: editContact.id,
              data: {
                firstName: editContact.firstName,
                lastName: editContact.lastName,
                email: editContact.email || undefined,
                phone: editContact.phone || undefined,
                companyName: editContact.companyName || undefined,
              },
            })
          }
          isSubmitting={updateContact.isPending}
          submitLabel="Save Changes"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name">
              <Input
                value={editContact.firstName ?? ""}
                onChange={(e) => setEditContact((p: any) => ({ ...p, firstName: e.target.value }))}
              />
            </FormField>
            <FormField label="Last Name">
              <Input
                value={editContact.lastName ?? ""}
                onChange={(e) => setEditContact((p: any) => ({ ...p, lastName: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={editContact.email ?? ""}
              onChange={(e) => setEditContact((p: any) => ({ ...p, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={editContact.phone ?? ""}
              onChange={(e) => setEditContact((p: any) => ({ ...p, phone: e.target.value }))}
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={editContact.companyName ?? ""}
              onChange={(e) => setEditContact((p: any) => ({ ...p, companyName: e.target.value }))}
            />
          </FormField>
        </FormModal>
      )}
    </div>
  );
}
