import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  DollarSign,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/intelligence/predictive")({
  component: Predictive,
});

const forecasts = [
  { metric: "Revenue", current: "$118K", predicted: "$135K", confidence: 92, trend: "up" },
  { metric: "New Customers", current: "710", predicted: "850", confidence: 88, trend: "up" },
  { metric: "Churn Rate", current: "2.1%", predicted: "1.8%", confidence: 85, trend: "down" },
  { metric: "Avg Order Value", current: "$147", predicted: "$152", confidence: 78, trend: "up" },
];

const revenueForecast = [
  { month: "Mar", actual: 118000, predicted: null },
  { month: "Apr", actual: null, predicted: 125000 },
  { month: "May", actual: null, predicted: 132000 },
  { month: "Jun", actual: null, predicted: 140000 },
  { month: "Jul", actual: null, predicted: 148000 },
  { month: "Aug", actual: null, predicted: 155000 },
];

const modelAccuracy = [
  { model: "Revenue Forecast", accuracy: 92, predictions: 156 },
  { model: "Churn Prediction", accuracy: 87, predictions: 234 },
  { model: "Customer Lifetime Value", accuracy: 85, predictions: 189 },
  { model: "Demand Forecasting", accuracy: 89, predictions: 312 },
];

function Predictive() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Predictive Analytics</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered forecasts and trend predictions
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
          <Sparkles className="h-4 w-4" />
          Retrain Models
        </button>
      </div>

      {/* AI Insight Banner */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-foreground">AI Forecast Summary</p>
              <p className="text-xs text-muted-foreground">
                Based on current trends, we predict a 14% increase in revenue next quarter with 92% confidence
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {forecasts.map((forecast) => (
          <Card key={forecast.metric} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{forecast.metric}</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold">{forecast.predicted}</p>
                <span className={`flex items-center gap-0.5 text-xs ${
                  forecast.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {forecast.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  vs now
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{forecast.confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${forecast.confidence}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast Chart */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Revenue Forecast (3 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueForecast}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                fill="#3b82f620"
                name="Actual"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#10b981"
                strokeDasharray="5 5"
                fill="#10b98120"
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#3b82f6]" />
              <span className="text-xs text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#10b981]" style={{ borderStyle: "dashed" }} />
              <span className="text-xs text-muted-foreground">Predicted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Accuracy */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Prediction Model Accuracy</h3>
          <div className="space-y-3">
            {modelAccuracy.map((model) => (
              <div key={model.model} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{model.model}</span>
                    <span className="text-sm font-medium">{model.accuracy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${model.accuracy}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-20">{model.predictions} predictions</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
