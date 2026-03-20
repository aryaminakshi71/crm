/**
 * CRM Contacts List
 *
 * Contact list with search, filters, and bulk actions.
 */

import { Badge, Button, Card, CardContent, Input, Modal, FormField } from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Filter,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  Download,
  Upload,
  Building2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/contacts")({
  component: ContactsList,
});

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  location: string;
  website: string;
  status: "active" | "inactive" | "lead";
  lastActivity: string;
  dealsCount: number;
  totalValue: number;
  tags: string[];
}

const mockContacts: Contact[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@acmecorp.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    jobTitle: "VP of Engineering",
    location: "San Francisco, CA",
    website: "acmecorp.com",
    status: "active",
    lastActivity: "2024-03-15",
    dealsCount: 3,
    totalValue: 245000,
    tags: ["enterprise", "decision-maker"],
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@techstart.io",
    phone: "+1 (555) 234-5678",
    company: "TechStart Inc",
    jobTitle: "CEO",
    location: "Austin, TX",
    website: "techstart.io",
    status: "lead",
    lastActivity: "2024-03-14",
    dealsCount: 1,
    totalValue: 89000,
    tags: ["startup", "hot-lead"],
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Chen",
    email: "mchen@dataflow.com",
    phone: "+1 (555) 345-6789",
    company: "DataFlow Ltd",
    jobTitle: "CTO",
    location: "Seattle, WA",
    website: "dataflow.com",
    status: "active",
    lastActivity: "2024-03-13",
    dealsCount: 2,
    totalValue: 156000,
    tags: ["enterprise", "technical"],
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Wong",
    email: "emily.wong@global.com",
    phone: "+1 (555) 456-7890",
    company: "Global Industries",
    jobTitle: "Procurement Manager",
    location: "New York, NY",
    website: "globalindustries.com",
    status: "active",
    lastActivity: "2024-03-12",
    dealsCount: 4,
    totalValue: 320000,
    tags: ["enterprise", "procurement"],
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Park",
    email: "dpark@startupxyz.com",
    phone: "+1 (555) 567-8901",
    company: "StartupXYZ",
    jobTitle: "Founder",
    location: "Denver, CO",
    website: "startupxyz.co",
    status: "lead",
    lastActivity: "2024-03-11",
    dealsCount: 1,
    totalValue: 36000,
    tags: ["startup", "founder"],
  },
  {
    id: "6",
    firstName: "Jennifer",
    lastName: "Lee",
    email: "jlee@financehub.com",
    phone: "+1 (555) 678-9012",
    company: "FinanceHub",
    jobTitle: "Director of IT",
    location: "Chicago, IL",
    website: "financehub.com",
    status: "active",
    lastActivity: "2024-03-10",
    dealsCount: 2,
    totalValue: 178000,
    tags: ["finance", "decision-maker"],
  },
  {
    id: "7",
    firstName: "Robert",
    lastName: "Kim",
    email: "rkim@retailco.com",
    phone: "+1 (555) 789-0123",
    company: "RetailCo",
    jobTitle: "Operations Manager",
    location: "Los Angeles, CA",
    website: "retailco.com",
    status: "inactive",
    lastActivity: "2024-03-01",
    dealsCount: 0,
    totalValue: 0,
    tags: ["retail"],
  },
  {
    id: "8",
    firstName: "Lisa",
    lastName: "Wang",
    email: "lwang@megacorp.com",
    phone: "+1 (555) 890-1234",
    company: "MegaCorp",
    jobTitle: "Senior Buyer",
    location: "Boston, MA",
    website: "megacorp.com",
    status: "active",
    lastActivity: "2024-03-09",
    dealsCount: 5,
    totalValue: 545000,
    tags: ["enterprise", "long-term"],
  },
];

function ContactsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // New contact form state
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    location: "",
    website: "",
  });

  const filteredContacts = mockContacts.filter((contact) => {
    const matchesSearch =
      searchQuery === "" ||
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreateContact = () => {
    toast.success("Contact created successfully");
    setShowCreateModal(false);
    setNewContact({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      location: "",
      website: "",
    });
  };

  const handleDeleteContacts = () => {
    toast.success(`Deleted ${selectedContacts.length} contacts`);
    setSelectedContacts([]);
    setShowDeleteConfirm(false);
  };

  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-700 border-gray-200",
    lead: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedContacts.length} contact{selectedContacts.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContacts([])}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deals</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Value</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tags</th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No contacts found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/app/crm/contacts/${contact.id}` as string}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {contact.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contact.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {contact.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={statusColors[contact.status]}
                        >
                          {contact.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{contact.dealsCount}</td>
                      <td className="p-4 text-sm font-medium">
                        ${(contact.totalValue / 1000).toFixed(0)}K
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredContacts.length} of {mockContacts.length} contacts
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Contact</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name</label>
                    <Input
                      value={newContact.firstName}
                      onChange={(e) =>
                        setNewContact({ ...newContact, firstName: e.target.value })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name</label>
                    <Input
                      value={newContact.lastName}
                      onChange={(e) =>
                        setNewContact({ ...newContact, lastName: e.target.value })
                      }
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                    placeholder="john.smith@company.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Company</label>
                  <Input
                    value={newContact.company}
                    onChange={(e) =>
                      setNewContact({ ...newContact, company: e.target.value })
                    }
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Job Title</label>
                  <Input
                    value={newContact.jobTitle}
                    onChange={(e) =>
                      setNewContact({ ...newContact, jobTitle: e.target.value })
                    }
                    placeholder="VP of Engineering"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input
                    value={newContact.location}
                    onChange={(e) =>
                      setNewContact({ ...newContact, location: e.target.value })
                    }
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContact}>Create Contact</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold mb-2">Delete Contacts</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {selectedContacts.length} contact
              {selectedContacts.length > 1 ? "s" : ""}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteContacts}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
