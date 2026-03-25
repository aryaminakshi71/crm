import { Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { speechApi } from "@/lib/api";

export const Route = createFileRoute("/app/speech/vocabulary")({
  component: VocabularyPage,
});

interface VocabularyWord {
  id: string;
  word: string;
  type: "company" | "technical" | "name" | "slang";
  occurrences: number;
}

function VocabularyPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["speech", "vocabulary"],
    queryFn: () => speechApi.vocabulary.list(),
    placeholderData: (prev) => prev,
  });

  const vocab: VocabularyWord[] = (data as any)?.data ?? [];

  const filteredVocab = vocab.filter((v) =>
    (v.word ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: VocabularyWord["type"]) => {
    switch (type) {
      case "company": return "bg-blue-100 text-blue-800";
      case "technical": return "bg-purple-100 text-purple-800";
      case "name": return "bg-green-100 text-green-800";
      case "slang": return "bg-amber-100 text-amber-800";
    }
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Custom Vocabulary</h2>
            <p className="text-muted-foreground text-sm">Add custom words to improve transcription accuracy</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add Word
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vocabulary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredVocab.map((vocab) => (
              <div key={vocab.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{vocab.word}</h3>
                  <p className="text-sm text-muted-foreground">{vocab.occurrences} occurrences</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(vocab.type)}`}>
                  {vocab.type}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
