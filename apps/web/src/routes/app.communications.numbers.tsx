import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  Plus,
  Search,
  Settings,
  Trash2,
  Copy,
  CheckCircle,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/numbers")({
  component: PhoneNumbersPage,
});

interface PhoneNumber {
  id: string;
  number: string;
  type: "toll_free" | "local" | "did" | "vanity";
  status: "active" | "inactive" | "pending";
  capabilities: ("sms" | "voice" | "fax")[];
  monthlyCost: number;
  location?: string;
}

const MOCK_NUMBERS: PhoneNumber[] = [
  { id: "n1", number: "+1 800-555-1234", type: "toll_free", status: "active", capabilities: ["sms", "voice"], monthlyCost: 1.00, location: "US" },
  { id: "n2", number: "+1 555-123-4567", type: "did", status: "active", capabilities: ["sms", "voice"], monthlyCost: 2.00, location: "New York, NY" },
  { id: "n3", number: "+1 555-234-5678", type: "did", status: "active", capabilities: ["sms", "voice", "fax"], monthlyCost: 2.50, location: "Los Angeles, CA" },
  { id: "n4", number: "+1 800-555-5678", type: "toll_free", status: "inactive", capabilities: ["voice"], monthlyCost: 1.00, location: "US" },
  { id: "n5", number: "+1 555-345-6789", type: "vanity", status: "active", capabilities: ["sms", "voice"], monthlyCost: 5.00, location: "Chicago, IL" },
];

function PhoneNumbersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNumbers = MOCK_NUMBERS.filter((num) => {
    return num.number.includes(searchQuery) || num.location?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTypeBadge = (type: PhoneNumber["type"]) => {
    switch (type) {
      case "toll_free": return <Badge className="bg-blue-100 text-blue-800">Toll-Free</Badge>;
      case "local": return <Badge className="bg-green-100 text-green-800">Local</Badge>;
      case "did": return <Badge className="bg-purple-100 text-purple-800">DID</Badge>;
      case "vanity": return <Badge className="bg-amber-100 text-amber-800">Vanity</Badge>;
    }
  };

  const getStatusBadge = (status: PhoneNumber["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive": return <Badge variant="outline">Inactive</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Phone Numbers</h2>
            <p className="text-muted-foreground text-sm">Manage your phone numbers for SMS and Voice</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Purchase Number
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Numbers</p>
                <p className="text-xl font-bold">{MOCK_NUMBERS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{MOCK_NUMBERS.filter((n) => n.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-xl font-bold">${MOCK_NUMBERS.reduce((sum, n) => sum + n.monthlyCost, 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">States</p>
                <p className="text-xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by number or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      {/* Numbers List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredNumbers.map((num) => (
              <div key={num.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{num.number}</h3>
                    {getTypeBadge(num.type)}
                    {getStatusBadge(num.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {num.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {num.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {num.capabilities.map((cap) => (
                        <span key={cap} className="px-1.5 py-0.5 bg-muted rounded text-xs uppercase">{cap}</span>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${num.monthlyCost.toFixed(2)}/mo</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
