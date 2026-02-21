/**
 * Contacts Route
 *
 * Contact management page with list view.
 */

import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { contactsApi } from "../lib/api";

export const Route = createFileRoute("/app/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts", search, currentPage],
    queryFn: () =>
      contactsApi.list({ page: currentPage, limit: itemsPerPage, search }),
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newContact) => {
      // Validate required fields
      if (!data.firstName.trim() || !data.lastName.trim()) {
        throw new Error("First name and last name are required");
      }
      return contactsApi.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        companyName: data.companyName.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Contact created successfully");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setIsModalOpen(false);
      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create contact";
      toast.error(errorMessage);
      console.error("Contact creation error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      toast.success("Contact deleted");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const contacts = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages =
    data?.totalPages ||
    (data?.total && data?.limit ? Math.ceil(data.total / data.limit) : 1);

  // Client-side filtering for search (server-side search can be added later)
  const filteredContacts = contacts.filter((contact: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(searchLower) ||
      contact.lastName?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.companyName?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 max-w-md flex-1" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your contacts and relationships
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="font-bold text-destructive text-xl">!</span>
            </div>
            <h3 className="mb-2 font-medium text-foreground text-lg">
              Failed to load contacts
            </h3>
            <p className="mb-4 text-muted-foreground">
              {error.message ||
                "An unexpected error occurred while fetching contacts."}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and relationships
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No contacts yet"
          description="Get started by adding your first contact."
          action={{ label: "Add Contact", onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredContacts.map((contact: any) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="font-medium text-primary text-sm">
                          {contact.firstName?.[0]}
                          {contact.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <div className="mt-1 flex items-center gap-4">
                          {contact.email && (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Mail className="h-3 w-3" /> {contact.email}
                            </span>
                          )}
                          {contact.companyName && (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Building2 className="h-3 w-3" />{" "}
                              {contact.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          contact.status === "customer" ? "success" : "default"
                        }
                      >
                        {contact.status || "contact"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(contact.id)}
                        loading={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
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

      {/* Create Contact Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newContact);
        }}
        title="Add New Contact"
        submitText="Create Contact"
        loading={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input
                value={newContact.firstName}
                onChange={(e) =>
                  setNewContact({ ...newContact, firstName: e.target.value })
                }
                required
              />
            </FormField>
            <FormField label="Last Name" required>
              <Input
                value={newContact.lastName}
                onChange={(e) =>
                  setNewContact({ ...newContact, lastName: e.target.value })
                }
                required
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={newContact.email}
              onChange={(e) =>
                setNewContact({ ...newContact, email: e.target.value })
              }
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newContact.phone}
              onChange={(e) =>
                setNewContact({ ...newContact, phone: e.target.value })
              }
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={newContact.companyName}
              onChange={(e) =>
                setNewContact({ ...newContact, companyName: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
