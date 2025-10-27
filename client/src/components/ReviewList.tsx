import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface ReviewListProps {
  reviews: string[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-md">
      <div className="border-b border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
            <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Top Negative Reviews</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Most critical feedback from users
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {reviews.map((review, index) => (
          <div 
            key={index} 
            className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-150"
            data-testid={`review-${index}`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <MessageSquare className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <p className="flex-1 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">{review}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
