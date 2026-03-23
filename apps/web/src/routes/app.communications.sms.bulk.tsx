import { Button, Card, CardContent, CardHeader, CardTitle, Input, Progress } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Upload,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/sms/bulk")({
  component: BulkSMSPage,
});

const MOCK_CAMPAIGNS = [
  { id: "1", name: "Spring Sale Announcement", recipients: 1500, sent: 1456, failed: 12, status: "completed", created: "Mar 15, 2024" },
  { id: "2", name: "New Product Launch", recipients: 2300, sent: 890, failed: 5, status: "sending", created: "Mar 18, 2024" },
  { id: "3", name: "Customer Survey", recipients: 5000, sent: 0, failed: 0, status: "draft", created: "Mar 19, 2024" },
];

function BulkSMSPage() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: campaignsData, isLoading, isError, refetch} = useQuery({
    queryKey: ["communications", "campaigns"],
    queryFn: () => communicationsApi.campaigns.list({ limit: 50 }),
  });

  const campaigns: typeof MOCK_CAMPAIGNS =
    campaignsData?.data ?? (Array.isArray(campaignsData) ? campaignsData : null) ?? MOCK_CAMPAIGNS;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsUploading(true);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    setIsUploading(false);
  };

  // Compute stats from fetched (or mock) campaign data
  const totalRecipients = campaigns.reduce((acc: number, c: any) => acc + (c.recipients ?? 0), 0);
  const totalSent = campaigns.reduce((acc: number, c: any) => acc + (c.sent ?? 0), 0);
  const totalFailed = campaigns.reduce((acc: number, c: any) => acc + (c.failed ?? 0), 0);
  const totalPending = campaigns
    .filter((c: any) => c.status === "sending")
    .reduce((acc: number, c: any) => acc + ((c.recipients ?? 0) - (c.sent ?? 0)), 0);

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/sms" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Bulk SMS Campaigns</h2>
            <p className="text-muted-foreground text-sm">Send SMS to large groups of recipients</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Campaign */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Create New Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  placeholder="Enter campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Recipients</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">
                      {file ? file.name : "Click to upload CSV or Excel file"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload a file with phone numbers and optional custom fields
                    </p>
                  </label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {file && !isUploading && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{file.name}</p>
                      <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                  Download Template
                </Button>
                <Button variant="primary" disabled={!campaignName || !file}>
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign: any) => (
                    <div key={campaign.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Created {campaign.created ?? (campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : "—")}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === "completed" ? "bg-green-100 text-green-800" :
                          campaign.status === "sending" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Recipients</p>
                          <p className="font-semibold">{(campaign.recipients ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sent</p>
                          <p className="font-semibold text-green-600">{(campaign.sent ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Failed</p>
                          <p className="font-semibold text-red-600">{campaign.failed ?? 0}</p>
                        </div>
                      </div>

                      {campaign.status === "sending" && (
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${campaign.recipients ? (campaign.sent / campaign.recipients) * 100 : 0}%` }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {campaign.status === "draft" && (
                          <>
                            <Button variant="primary" size="sm" leftIcon={<Play className="h-3 w-3" />}>
                              Start Campaign
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </>
                        )}
                        {campaign.status === "sending" && (
                          <>
                            <Button variant="outline" size="sm" leftIcon={<Pause className="h-3 w-3" />}>
                              Pause
                            </Button>
                            <Button variant="ghost" size="sm">
                              View Report
                            </Button>
                          </>
                        )}
                        {campaign.status === "completed" && (
                          <Button variant="outline" size="sm">
                            View Report
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Campaign Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800">Total Recipients</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totalRecipients.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">Successfully Sent</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{totalSent.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-800">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-900">{totalFailed.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-amber-800">Pending</span>
                </div>
                <p className="text-2xl font-bold text-amber-900">{totalPending.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
