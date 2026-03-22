import { Button, Card, CardContent, CardHeader, CardTitle, Input, ProgressBar } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  FileAudio,
  FileText,
  Settings,
  Play,
  Mic,
  Globe,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/speech/transcribe/new")({
  component: NewTranscriptionPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
];

function NewTranscriptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState("en");
  const [settings, setSettings] = useState({
    punctuate: true,
    timestamps: true,
    speakerDetection: true,
    profanityFilter: false,
    sentimentAnalysis: true,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsUploading(true);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setUploadProgress(i);
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
    }
  };

  const createTranscription = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("language", language);
      formData.append("settings", JSON.stringify(settings));

      const res = await fetch(`${API_BASE}/speech/transcriptions`, {
        method: "POST",
        headers: getOrgHeader(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to start transcription");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["speech", "transcriptions"] });
      toast.success("Transcription started!");
      navigate({ to: `/app/speech/transcribe/${data?.id ?? ""}` as string });
    },
    onError: () => {
      toast.error("Failed to start transcription. Please try again.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech/transcribe" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">New Transcription</h2>
            <p className="text-muted-foreground text-sm">Upload audio for transcription</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" /> Audio File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-2">Drop your audio file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">Supports MP3, WAV, M4A, FLAC, OGG (max 500MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileAudio className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {isUploading && (
                      <div className="w-32">
                        <ProgressBar value={uploadProgress} max={100} />
                        <p className="text-xs text-muted-foreground text-center mt-1">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                  {!isUploading && (
                    <Button variant="outline" onClick={() => setFile(null)}>
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      language === lang.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl mr-2">{lang.flag}</span>
                    <span className="font-medium text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Transcription Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "punctuate", label: "Automatic Punctuation", description: "Add punctuation to transcript" },
                { key: "timestamps", label: "Timestamps", description: "Include timestamps for each segment" },
                { key: "speakerDetection", label: "Speaker Detection", description: "Identify and label different speakers" },
                { key: "profanityFilter", label: "Profanity Filter", description: "Replace profanity with asterisks" },
                { key: "sentimentAnalysis", label: "Sentiment Analysis", description: "Analyze sentiment of each speaker" },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [setting.key]: !settings[setting.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[setting.key as keyof typeof settings] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings[setting.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="border-border/60 sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">File</p>
                <p className="font-medium">{file ? file.name : "No file selected"}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Language</p>
                <p className="font-medium">{LANGUAGES.find((l) => l.code === language)?.name}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Estimated Duration</p>
                <p className="font-medium">{file ? "~5-10 minutes" : "-"}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                <p className="font-medium">{file ? "$0.50 - $1.00" : "-"}</p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Mic className="h-4 w-4" />}
                disabled={!file || isUploading || createTranscription.isPending}
                onClick={() => createTranscription.mutate()}
              >
                {isUploading
                  ? "Uploading..."
                  : createTranscription.isPending
                  ? "Starting..."
                  : "Start Transcription"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
