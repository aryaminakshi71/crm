/**
 * CRM Pipeline Board
 *
 * Kanban-style pipeline board with drag and drop functionality.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Filter,
  GripVertical,
  Plus,
  Search,
  Settings,
  MoreHorizontal,
  Phone,
  Mail,
  DollarSign,
  Clock,
  User,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/crm/pipeline")({
  component: PipelineBoard,
});

interface DealCard {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  contact: string;
  daysInStage: number;
  nextAction: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: DealCard[];
}

const initialStages: PipelineStage[] = [
  {
    id: "lead",
    name: "Lead",
    color: "#818cf8",
    deals: [
      {
        id: "1",
        title: "Enterprise SaaS License",
        company: "Acme Corporation",
        value: 125000,
        probability: 10,
        contact: "John Smith",
        daysInStage: 3,
        nextAction: "Initial call scheduled",
      },
      {
        id: "2",
        title: "Cloud Migration Project",
        company: "TechStart Inc",
        value: 89000,
        probability: 15,
        contact: "Sarah Johnson",
        daysInStage: 5,
        nextAction: "Send pricing proposal",
      },
      {
        id: "3",
        title: "Security Audit Services",
        company: "DataFlow Ltd",
        value: 45000,
        probability: 20,
        contact: "Mike Chen",
        daysInStage: 2,
        nextAction: "Discovery call",
      },
    ],
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "#a78bfa",
    deals: [
      {
        id: "4",
        title: "Platform Integration",
        company: "Global Industries",
        value: 156000,
        probability: 30,
        contact: "Emily Wong",
        daysInStage: 7,
        nextAction: "Technical demo tomorrow",
      },
      {
        id: "5",
        title: "Annual Support Contract",
        company: "StartupXYZ",
        value: 36000,
        probability: 40,
        contact: "David Park",
        daysInStage: 4,
        nextAction: "Contract review",
      },
    ],
  },
  {
    id: "proposal",
    name: "Proposal",
    color: "#22d3ee",
    deals: [
      {
        id: "6",
        title: "Data Analytics Suite",
        company: "FinanceHub",
        value: 78000,
        probability: 50,
        contact: "Jennifer Lee",
        daysInStage: 10,
        nextAction: "Awaiting proposal approval",
      },
      {
        id: "7",
        title: "Mobile App Development",
        company: "RetailCo",
        value: 92000,
        probability: 60,
        contact: "Robert Kim",
        daysInStage: 6,
        nextAction: "Follow up on feedback",
      },
    ],
  },
  {
    id: "negotiation",
    name: "Negotiation",
    color: "#fbbf24",
    deals: [
      {
        id: "8",
        title: "Full Platform License",
        company: "MegaCorp",
        value: 245000,
        probability: 75,
        contact: "Lisa Wang",
        daysInStage: 12,
        nextAction: "Legal review in progress",
      },
      {
        id: "9",
        title: "Custom Integration",
        company: "CloudSystems",
        value: 67000,
        probability: 80,
        contact: "Tom Harris",
        daysInStage: 8,
        nextAction: "Contract negotiation",
      },
    ],
  },
  {
    id: "closed",
    name: "Closed Won",
    color: "#22c55e",
    deals: [
      {
        id: "10",
        title: "Enterprise Agreement",
        company: "Acme Corp",
        value: 180000,
        probability: 100,
        contact: "Anna Brown",
        daysInStage: 15,
        nextAction: "Onboarding scheduled",
      },
    ],
  },
];

function PipelineBoard() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedDeal, setDraggedDeal] = useState<{ deal: DealCard; stageId: string } | null>(null);

  const totalPipelineValue = stages.reduce((sum, stage) => {
    return sum + stage.deals.reduce((dealSum, deal) => dealSum + deal.value, 0);
  }, 0);

  const handleDragStart = (deal: DealCard, stageId: string) => {
    setDraggedDeal({ deal, stageId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStageId: string) => {
    if (!draggedDeal) return;

    setStages((prevStages) => {
      const newStages = prevStages.map((stage) => {
        if (stage.id === draggedDeal.stageId) {
          return {
            ...stage,
            deals: stage.deals.filter((d) => d.id !== draggedDeal.deal.id),
          };
        }
        if (stage.id === targetStageId) {
          return {
            ...stage,
            deals: [...stage.deals, draggedDeal.deal],
          };
        }
        return stage;
      });
      return newStages;
    });

    setDraggedDeal(null);
  };

  const filteredStages = stages.map((stage) => ({
    ...stage,
    deals: stage.deals.filter(
      (deal) =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contact.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Pipeline</p>
            <p className="font-bold text-lg text-foreground">
              ${(totalPipelineValue / 1000).toFixed(0)}K
            </p>
          </div>
          <Button onClick={() => navigate({ to: "/app/crm/deals", search: { action: "create" } })}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {filteredStages.map((stage) => (
            <div
              key={stage.id}
              className="w-[300px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="bg-muted/30 rounded-lg p-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stage.deals.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stage Value */}
                <div className="text-xs text-muted-foreground mb-3">
                  ${(stage.deals.reduce((sum, d) => sum + d.value, 0) / 1000).toFixed(0)}K
                </div>

                {/* Deal Cards */}
                <div className="space-y-2">
                  {stage.deals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No deals in this stage
                    </div>
                  ) : (
                    stage.deals.map((deal) => (
                      <Card
                        key={deal.id}
                        className="border-border/60 hover:border-primary/50 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                        draggable
                        onDragStart={() => handleDragStart(deal, stage.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/app/crm/deals/${deal.id}` as string}
                                className="font-medium text-sm hover:text-primary transition-colors"
                              >
                                {deal.title}
                              </Link>
                              <p className="text-xs text-muted-foreground">{deal.company}</p>
                            </div>
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">
                              ${(deal.value / 1000).toFixed(0)}K
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${deal.probability}%`,
                                    backgroundColor: stage.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {deal.probability}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deal.contact}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {deal.daysInStage} days in stage
                            </span>
                          </div>

                          <div className="mt-2 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground truncate">
                            {deal.nextAction}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Legend:</span>
            {[
              { color: "#818cf8", label: "Lead - Initial contact" },
              { color: "#a78bfa", label: "Qualified - Needs confirmed" },
              { color: "#22d3ee", label: "Proposal - Sent to client" },
              { color: "#fbbf24", label: "Negotiation - Terms discussion" },
              { color: "#22c55e", label: "Closed Won - Deal secured" },
            ].map((item) => (
              <div key={item.color} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
