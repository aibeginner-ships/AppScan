import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import SummaryCards from "@/components/SummaryCards";
import ReviewList from "@/components/ReviewList";
import TrendChart from "@/components/TrendChart";
import InsightSummary from "@/components/InsightSummary";
import WhatLoveHateBlock from "@/components/WhatLoveHateBlock";
import InsightCards from "@/components/InsightCards";
import type { AnalysisResult } from "@shared/schema";

interface AnalysisProps {
  data: AnalysisResult;
  onBack: () => void;
}

export default function Analysis({ data, onBack }: AnalysisProps) {
  const insightsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to insights section after initial render
  useEffect(() => {
    if (insightsRef.current && data.insights.length > 0) {
      const timer = setTimeout(() => {
        insightsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data.insights.length]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-neutral-900 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-semibold text-[#111827] dark:text-neutral-100" data-testid="text-app-name">
            Your app analysis
          </h2>
          <div className="mt-2 flex items-center gap-4">
            <h3 className="text-xl text-[#6B7280] dark:text-neutral-400">{data.appName}</h3>
            <Badge variant="secondary" data-testid="badge-store">
              {data.store}
            </Badge>
          </div>
        </div>

        <div className="space-y-10">
          <SummaryCards
            positiveCategories={data.positiveCategories}
            negativeCategories={data.negativeCategories}
            averageRating={data.averageRating}
            totalReviews={data.totalReviews}
            positivePercentage={data.positivePercentage}
            negativePercentage={data.negativePercentage}
          />

          <InsightSummary summary={data.summary} />

          <TrendChart data={data.trend} />

          <WhatLoveHateBlock
            whatUsersLove={data.whatUsersLove}
            whatUsersHate={data.whatUsersHate}
          />

          <div ref={insightsRef} className="animate-fadeIn scroll-mt-8">
            <InsightCards insights={data.insights} />
          </div>

          <ReviewList reviews={data.topNegativeReviews} />

          <div className="flex justify-center pt-8">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              data-testid="button-try-another"
            >
              Try Another App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
