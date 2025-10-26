import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummaryCardsProps {
  positiveCategories: string[];
  negativeCategories: string[];
  averageRating: number;
  totalReviews: number;
}

export default function SummaryCards({
  positiveCategories,
  negativeCategories,
  averageRating,
  totalReviews,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
          <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Positive Feedback
        </h3>
        <div className="mt-4 flex flex-wrap gap-2" data-testid="positive-categories">
          {positiveCategories.map((category, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
            >
              {category}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
          <ThumbsDown className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Negative Feedback
        </h3>
        <div className="mt-4 flex flex-wrap gap-2" data-testid="negative-categories">
          {negativeCategories.map((category, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {category}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Star className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Average Rating
        </h3>
        <div className="mt-2">
          <p className="font-mono text-4xl font-bold" data-testid="text-average-rating">
            {averageRating.toFixed(1)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-total-reviews">
            Based on {totalReviews} reviews
          </p>
        </div>
      </Card>
    </div>
  );
}
