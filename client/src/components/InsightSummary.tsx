import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface InsightSummaryProps {
  summary: string;
}

export default function InsightSummary({ summary }: InsightSummaryProps) {
  return (
    <Card className="p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950">
          <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Key Insight</h3>
          <p className="mt-2 text-muted-foreground" data-testid="text-insight-summary">
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
