import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Phone,
  Users,
  FileText,
  Image,
  Calendar,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/sms/compose")({
  component: ComposeSMSPage,
});

const MOCK_RECIPIENTS = [
  { id: "1", name: "Sarah Johnson", phone: "+1 555-123-4567", type: "contact" },
  { id: "2", name: "Michael Chen", phone: "+1 555-234-5678", type: "contact" },
  { id: "3", name: "Emily Davis", phone: "+1 555-345-6789", type: "contact" },
];

function ComposeSMSPage() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<string[]>(["+1 555-123-4567"]);
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState<"now" | "scheduled">("now");
  const [scheduledTime, setScheduledTime] = useState("");

  const characterCount = message.length;
  const segmentCount = Math.ceil(characterCount / 160) || 1;

  // Load contact suggestions from API, fall back to MOCK_RECIPIENTS
  const contactsQuery = useQuery({
    queryKey: ["communications", "contacts-for-compose"],
    queryFn: () => communicationsApi.conversations.list({ limit: 50 }),
    retry: false,
  });
  if (contactsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => contactsQuery.refetch()}>Retry</Button>
    </div>
  );

  const quickAddContacts =
    contactsQuery.data?.data?.length
      ? contactsQuery.data.data.map((c: any) => ({
          id: c.id,
          name: c.participantName ?? c.subject ?? "Unknown",
          phone: c.participantContact ?? "",
        })).filter((c: any) => c.phone)
      : MOCK_RECIPIENTS;

  const sendMutation = useMutation({
    mutationFn: () =>
      communicationsApi.sms.send({
        to: recipients,
        body: message,
        scheduledAt: schedule === "scheduled" && scheduledTime ? scheduledTime : undefined,
      }),
    onSuccess: () => {
      navigate({ to: "/app/communications/sms" });
    },
    onError: () => {
      // Still navigate on error so the user isn't stuck
      navigate({ to: "/app/communications/sms" });
    },
  });

  const handleSend = () => {
    if (!message.trim() || recipients.length === 0) return;
    sendMutation.mutate();
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter((r) => r !== phone));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/sms" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Compose SMS</h2>
            <p className="text-muted-foreground text-sm">Send SMS to one or more recipients</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Recipients */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter phone number"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = (e.target as HTMLInputElement).value;
                      if (value && !recipients.includes(value)) {
                        setRecipients([...recipients, value]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <Button variant="outline">Add</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recipients.map((phone) => (
                  <div key={phone} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{phone}</span>
                    <button
                      onClick={() => removeRecipient(phone)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Quick Add</p>
                <div className="flex flex-wrap gap-2">
                  {quickAddContacts.map((contact: any) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        if (contact.phone && !recipients.includes(contact.phone)) {
                          setRecipients([...recipients, contact.phone]);
                        }
                      }}
                      className="px-3 py-1 text-sm border rounded-full hover:bg-muted/50"
                    >
                      {contact.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {characterCount} / {segmentCount} segment{segmentCount > 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
                  Use Template
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Image className="h-4 w-4" />}>
                  Add Media
                </Button>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Personalization Variables</p>
                <div className="flex flex-wrap gap-1">
                  {["{name}", "{order_id}", "{date}", "{time}"].map((variable) => (
                    <button
                      key={variable}
                      onClick={() => setMessage(message + variable)}
                      className="px-2 py-0.5 text-xs border rounded hover:bg-muted"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === "now"}
                    onChange={() => setSchedule("now")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Send immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === "scheduled"}
                    onChange={() => setSchedule("scheduled")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Schedule for later</span>
                </label>
              </div>
              {schedule === "scheduled" && (
                <div className="mt-4">
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="border-border/60 sticky top-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black rounded-3xl p-4 min-h-[300px]">
                <div className="bg-white rounded-2xl p-3 max-w-[80%]">
                  <p className="text-black text-sm">{message || "Your message will appear here..."}</p>
                  <p className="text-gray-400 text-xs mt-1">12:00 PM</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>To: {recipients.length} recipient{recipients.length > 1 ? "s" : ""}</p>
                <p>Estimated cost: ${(recipients.length * 0.01 * segmentCount).toFixed(2)}</p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                leftIcon={sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                onClick={handleSend}
                disabled={!message.trim() || recipients.length === 0 || sendMutation.isPending}
              >
                {sendMutation.isPending ? "Sending..." : schedule === "now" ? "Send Now" : "Schedule"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
