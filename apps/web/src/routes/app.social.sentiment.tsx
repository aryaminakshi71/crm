import { Button, Card, CardContent } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/app/social/sentiment")({
  component: SentimentPage,
});

const SENTIMENT_DATA = [
  { date: "Mar 12", positive: 65, neutral: 25, negative: 10 },
  { date: "Mar 13", positive: 72, neutral: 20, negative: 8 },
  { date: "Mar 14", positive: 58, neutral: 30, negative: 12 },
  { date: "Mar 15", positive: 78, neutral: 15, negative: 7 },
  { date: "Mar 16", positive: 82, neutral: 12, negative: 6 },
  { date: "Mar 17", positive: 75, neutral: 18, negative: 7 },
  { date: "Mar 18", positive: 80, neutral: 15, negative: 5 },
];

function SentimentPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Sentiment Analysis</h2>
            <p className="text-muted-foreground text-sm">Analyze sentiment across social media</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-xl font-bold">73%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Minus className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neutral</p>
                <p className="text-xl font-bold">19%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Negative</p>
                <p className="text-xl font-bold">8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Sentiment Over Time
          </h3>
          <div className="h-64 flex items-end gap-2">
            {SENTIMENT_DATA.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 h-48">
                  <div className="flex-1 bg-green-500 rounded-t transition-all" style={{ height: `${data.positive}%` }} />
                  <div className="flex-1 bg-gray-400 rounded-t transition-all" style={{ height: `${data.neutral}%` }} />
                  <div className="flex-1 bg-red-500 rounded-t transition-all" style={{ height: `${data.negative}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{data.date}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-sm">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-gray-400" />
              <span className="text-sm">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span className="text-sm">Negative</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
