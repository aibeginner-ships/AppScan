import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface InsightSummaryProps {
  summary: string;
}

export default function InsightSummary({ summary }: InsightSummaryProps) {
  return (
    <Card className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Key Insight</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300" data-testid="text-insight-summary">
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
