import {
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
import { Mic, MessageSquare, Phone, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/numbers")({
  component: PhoneNumbersPage,
});

// ─── Fallback mock data ───────────────────────────────────────────────────────

const MOCK_NUMBERS = [
  {
    id: "mock-num-1",
    number: "+15550001234",
    friendlyName: "Main Line",
    provider: "twilio",
    status: "active",
    capabilities: { voice: true, sms: true, mms: false },
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-num-2",
    number: "+15550005678",
    friendlyName: "Support",
    provider: "twilio",
    status: "active",
    capabilities: { voice: false, sms: true, mms: true },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-muted text-muted-foreground",
  porting: "bg-yellow-500/20 text-yellow-400",
};

function PhoneNumbersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ number: "", friendlyName: "", provider: "twilio" });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "phone-numbers"],
    queryFn: () => communicationsApi.phoneNumbers.list({ page: 1, limit: 100 }),
  });

  const numbers: any[] = data?.data ?? MOCK_NUMBERS;

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      communicationsApi.phoneNumbers.create({
        number: payload.number,
        friendlyName: payload.friendlyName || undefined,
        provider: payload.provider || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "phone-numbers"] });
      toast.success("Phone number added");
      setIsModalOpen(false);
      setForm({ number: "", friendlyName: "", provider: "twilio" });
    },
    onError: () => toast.error("Failed to add phone number"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-400" />
            Phone Numbers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage provisioned numbers and their capabilities
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Number
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-20" />
          ))}
        </div>
      ) : numbers.length === 0 ? (
        <EmptyState
          icon={<Phone className="h-10 w-10 text-muted-foreground" />}
          title="No phone numbers"
          description="Add a provisioned number to start sending and receiving calls and SMS."
        />
      ) : (
        <div className="space-y-3">
          {numbers.map((num) => (
            <Card key={num.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{num.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {num.friendlyName ?? "No label"} · {num.provider}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Capabilities */}
                  <div className="flex gap-1">
                    {num.capabilities?.voice && (
                      <span title="Voice" className="text-muted-foreground">
                        <Mic className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {num.capabilities?.sms && (
                      <span title="SMS" className="text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {num.capabilities?.mms && (
                      <span title="MMS" className="text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[num.status] ?? ""}`}
                  >
                    {num.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(num.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-sm text-destructive">
          Could not load live data — showing cached results.
        </p>
      )}

      {/* Add modal */}
      <FormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Phone Number"
        onSubmit={() => createMutation.mutate(form)}
        isSubmitting={createMutation.isPending}
        submitLabel="Add Number"
      >
        <FormField label="Phone number" required>
          <Input
            placeholder="+15550001234"
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          />
        </FormField>
        <FormField label="Friendly name">
          <Input
            placeholder="e.g. Main Line, Support"
            value={form.friendlyName}
            onChange={(e) => setForm((f) => ({ ...f, friendlyName: e.target.value }))}
          />
        </FormField>
        <FormField label="Provider">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
          >
            <option value="twilio">Twilio</option>
            <option value="vonage">Vonage</option>
            <option value="telnyx">Telnyx</option>
            <option value="other">Other</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
