import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface ReviewListProps {
  reviews: string[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-card-border p-6">
        <h3 className="text-xl font-semibold">Top Negative Reviews</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Most critical feedback from users
        </p>
      </div>
      <div className="divide-y divide-card-border">
        {reviews.map((review, index) => (
          <div 
            key={index} 
            className="p-6 hover-elevate"
            data-testid={`review-${index}`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="flex-1 text-base leading-relaxed">{review}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
