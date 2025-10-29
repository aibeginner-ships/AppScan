import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface InsightSummaryProps {
  summary: string;
}

export default function InsightSummary({ summary }: InsightSummaryProps) {
  return (
    <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#111827] dark:text-neutral-100">Key Insight</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280] dark:text-neutral-300" data-testid="text-insight-summary">
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
