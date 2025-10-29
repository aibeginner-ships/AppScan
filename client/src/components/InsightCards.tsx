import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, MessageSquare } from "lucide-react";
import type { Insight } from "@shared/schema";

interface InsightCardsProps {
  insights: Insight[];
}

export default function InsightCards({ insights }: InsightCardsProps) {
  if (insights.length === 0) {
    return null;
  }

  // v3.2: Modern badge colors for SaaS design
  const getImpactBadgeColor = (level: 'High' | 'Medium' | 'Low'): string => {
    if (level === 'High') return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    if (level === 'Medium') return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  const getConfidenceBadgeColor = (level: 'High' | 'Medium' | 'Low'): string => {
    if (level === 'High') return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    if (level === 'Medium') return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950">
          <Gauge className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#111827] dark:text-neutral-100">Actionable Insights</h3>
          <p className="text-sm text-[#6B7280] dark:text-neutral-400">
            Data-backed recommendations to improve your app
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="insight-cards-container">
        {insights.map((insight, index) => {
          // v3.1.3: Conditional quote display - only show if similarity > 0.5 AND length > 20
          const shouldShowQuote = insight.quote_similarity > 0.5 && insight.representative_quote.length > 20;

          return (
            <Card 
              key={index} 
              className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800" 
              data-testid={`insight-card-${index}`}
            >
              <div className="space-y-4">
                {/* Header: Title + Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <Gauge size={16} className="text-indigo-500 dark:text-indigo-400 mt-1 flex-shrink-0" />
                    <h4 className="text-base font-semibold text-[#111827] dark:text-neutral-100 leading-snug" data-testid={`insight-title-${index}`}>
                      {insight.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className={getImpactBadgeColor(insight.impact)}>
                      {insight.impact}
                    </Badge>
                    <Badge variant="secondary" className={getConfidenceBadgeColor(insight.confidence)}>
                      {insight.confidence}
                    </Badge>
                  </div>
                </div>

                {/* Why It Matters */}
                <p className="text-sm leading-relaxed text-[#6B7280] dark:text-neutral-300" data-testid={`insight-why-${index}`}>
                  {insight.why_it_matters}
                </p>

                {/* User Quote (Conditional) */}
                {shouldShowQuote && (
                  <blockquote className="border-l-2 border-gray-200 dark:border-neutral-700 pl-4 py-1 italic text-sm text-[#6B7280] dark:text-neutral-400" data-testid={`insight-quote-${index}`}>
                    "{insight.representative_quote}"
                  </blockquote>
                )}

                {/* Metrics Footer */}
                <div className="flex flex-wrap justify-between gap-3 text-xs text-[#6B7280] dark:text-neutral-400 pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1">
                    <MessageSquare size={12} className="text-gray-400 dark:text-neutral-500" />
                    <span data-testid={`insight-mentions-${index}`}>{insight.metrics.mentions} mentions</span>
                  </div>
                  <span data-testid={`insight-negative-ratio-${index}`}>
                    {(insight.metrics.negative_ratio * 100).toFixed(0)}% negative
                  </span>
                  <span data-testid={`insight-share-${index}`}>
                    {(insight.metrics.share * 100).toFixed(1)}% share
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
