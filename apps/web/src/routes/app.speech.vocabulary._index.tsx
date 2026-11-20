/**
 * Speech Vocabulary Index
 *
 * Manage custom words, abbreviations, and acronyms for improved transcription accuracy.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  BookOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { speechApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/app/speech/vocabulary/_index")({
  validateSearch: searchSchema,
  component: VocabularyIndexPage,
});

interface VocabEntry {
  id: string;
  word?: string;
  phrase?: string;
  term?: string;
  type?: "custom_word" | "abbreviation" | "acronym" | string;
  category?: string;
  addedBy?: string;
  createdBy?: string;
  usageCount?: number;
  uses?: number;
  createdAt?: string;
  addedAt?: string;
}

const _MOCK_VOCAB: VocabEntry[] = [
  { id: "V1", word: "Nucleo", type: "custom_word", addedBy: "Admin", usageCount: 342 },
  { id: "V2", word: "EHR", type: "acronym", addedBy: "Medical Team", usageCount: 178 },
  { id: "V3", word: "CRO", type: "abbreviation", addedBy: "Sales Team", usageCount: 89 },
  { id: "V4", word: "API", type: "acronym", addedBy: "Engineering", usageCount: 512 },
  { id: "V5", word: "KYC", type: "abbreviation", addedBy: "Compliance", usageCount: 44 },
  { id: "V6", word: "Zymurgist", type: "custom_word", addedBy: "HR", usageCount: 2 },
  { id: "V7", word: "SaaS", type: "acronym", addedBy: "Marketing", usageCount: 267 },
];

function getWord(v: VocabEntry) { return v.word ?? v.phrase ?? v.term ?? "—"; }
function getType(v: VocabEntry) { return v.type ?? v.category ?? "custom_word"; }
function getAddedBy(v: VocabEntry) { return v.addedBy ?? v.createdBy ?? "Unknown"; }
function getUsage(v: VocabEntry) { return v.usageCount ?? v.uses ?? 0; }
function getAddedAt(v: VocabEntry) {
  const raw = v.addedAt ?? v.createdAt;
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString();
}

const TYPE_LABELS: Record<string, string> = {
  custom_word: "Custom Word",
  abbreviation: "Abbreviation",
  acronym: "Acronym",
};

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    custom_word: "bg-blue-100 text-blue-700",
    abbreviation: "bg-orange-100 text-orange-700",
    acronym: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[type] ?? "bg-muted text-muted-foreground"}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function VocabularyIndexPage() {
  const queryClient = useQueryClient();
  const { q: searchQuery = "", type: filterType = "all" } = useSearch({ from: "/app/speech/vocabulary/_index" });
  const navigate = useNavigate({ from: "/app/speech/vocabulary" });
  const setSearchQuery = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setFilterType = (v: string) => navigate({ search: (p) => ({ ...p, type: v }) });
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newType, setNewType] = useState<"custom_word" | "abbreviation" | "acronym">("custom_word");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["speech-vocabulary-index"],
    queryFn: () => speechApi.vocabulary.list(),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { word: string; type: string }) =>
      speechApi.vocabulary.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speech-vocabulary-index"] });
      setShowAdd(false);
      setNewWord("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => speechApi.vocabulary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["speech-vocabulary-index"] }),
  });

  const vocab: VocabEntry[] =
    (data as any)?.data ?? [];

  const filtered = vocab.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getWord(v).toLowerCase().includes(q) ||
      getAddedBy(v).toLowerCase().includes(q);
    const matchType = filterType === "all" || getType(v) === filterType;
    return matchSearch && matchType;
  });

  const customWords = vocab.filter((v) => getType(v) === "custom_word").length;
  const acronyms = vocab.filter((v) => getType(v) === "acronym").length;
  const abbreviations = vocab.filter((v) => getType(v) === "abbreviation").length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load vocabulary. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Custom Vocabulary</h2>
          <p className="text-sm text-muted-foreground">
            Improve transcription accuracy with domain-specific terms
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAdd(true)}
        >
          Add Word
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Words</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{customWords}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acronyms</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{acronyms}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Abbreviations</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{abbreviations}</p>
              </div>
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Word Modal / Inline Form */}
      {showAdd && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Add Word to Vocabulary</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="Word or phrase"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
              />
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as typeof newType)}
              >
                <option value="custom_word">Custom Word</option>
                <option value="abbreviation">Abbreviation</option>
                <option value="acronym">Acronym</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newWord || createMutation.isPending}
                onClick={() => createMutation.mutate({ word: newWord, type: newType })}
              >
                {createMutation.isPending ? "Adding..." : "Add Word"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="custom_word">Custom Words</option>
          <option value="abbreviation">Abbreviations</option>
          <option value="acronym">Acronyms</option>
        </select>
      </div>

      {/* Vocabulary Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No vocabulary entries found</p>
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
                Add Word
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Word / Phrase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Added By</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Usage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Added</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm text-foreground">{getWord(entry)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={getType(entry)} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getAddedBy(entry)}</td>
                      <td className="px-4 py-3 text-center text-sm">{getUsage(entry).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getAddedAt(entry)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
