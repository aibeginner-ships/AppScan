import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Quote } from "lucide-react";
import type { Insight } from "@shared/schema";

interface InsightCardsProps {
  insights: Insight[];
}

export default function InsightCards({ insights }: InsightCardsProps) {
  if (insights.length === 0) {
    return null;
  }

  const getImpactLevel = (share: number): { label: string; color: string } => {
    if (share >= 0.15) return { label: "High", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" };
    if (share >= 0.08) return { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200" };
    return { label: "Low", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" };
  };

  const getConfidenceLevel = (mentions: number): { label: string; color: string } => {
    if (mentions >= 50) return { label: "High", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" };
    if (mentions >= 20) return { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200" };
    return { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <AlertCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Actionable Insights</h3>
          <p className="text-sm text-muted-foreground">
            Data-backed recommendations to improve your app
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6" data-testid="insight-cards-container">
        {insights.map((insight, index) => {
          const impact = getImpactLevel(insight.metrics.share);
          const confidence = getConfidenceLevel(insight.metrics.mentions);

          return (
            <Card key={index} className="p-8 hover-elevate" data-testid={`insight-card-${index}`}>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold" data-testid={`insight-title-${index}`}>
                    {insight.title}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Why It Matters
                    </p>
                    <p className="mt-1 text-muted-foreground" data-testid={`insight-why-${index}`}>
                      {insight.why_it_matters}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Mentions
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold" data-testid={`insight-mentions-${index}`}>
                        {insight.metrics.mentions}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Share of Reviews
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold" data-testid={`insight-share-${index}`}>
                        {(insight.metrics.share * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Negative Ratio
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-red-600 dark:text-red-400" data-testid={`insight-negative-ratio-${index}`}>
                        {(insight.metrics.negative_ratio * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Quote className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        User Quote
                      </p>
                    </div>
                    <p className="italic text-muted-foreground" data-testid={`insight-quote-${index}`}>
                      "{insight.representative_quote}"
                    </p>
                  </div>

                  <div className="rounded-lg bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Suggested Action
                      </p>
                    </div>
                    <p className="font-medium" data-testid={`insight-action-${index}`}>
                      {insight.suggested_action}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={impact.color}>
                    Impact: {impact.label}
                  </Badge>
                  <Badge variant="secondary" className={confidence.color}>
                    Confidence: {confidence.label}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
