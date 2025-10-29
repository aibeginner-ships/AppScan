import { ThumbsUp, ThumbsDown, Star, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummaryCardsProps {
  positiveCategories: string[];
  negativeCategories: string[];
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  negativePercentage: number;
}

export default function SummaryCards({
  positiveCategories,
  negativeCategories,
  averageRating,
  totalReviews,
  positivePercentage,
  negativePercentage,
}: SummaryCardsProps) {
  return (
    <div className="space-y-8">
      {/* App Sentiment Snapshot Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-neutral-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#111827] dark:text-neutral-100">
          <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
          App Sentiment Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-[#6B7280] dark:text-neutral-400">Avg Rating</div>
              <div className="text-base font-semibold text-[#111827] dark:text-neutral-100" data-testid="text-average-rating-inline">
                {averageRating.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-[#6B7280] dark:text-neutral-400">Positive</div>
              <div className="text-base font-semibold text-[#111827] dark:text-neutral-100" data-testid="text-positive-percentage-inline">
                {positivePercentage}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-[#6B7280] dark:text-neutral-400">Negative</div>
              <div className="text-base font-semibold text-[#111827] dark:text-neutral-100" data-testid="text-negative-percentage-inline">
                {negativePercentage}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-[#6B7280] dark:text-neutral-400">Reviews</div>
              <div className="text-base font-semibold text-[#111827] dark:text-neutral-100">
                {totalReviews}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-950">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-[#6B7280] dark:text-neutral-400">
            Positive Reviews
          </h3>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-green-600 dark:text-green-400" data-testid="text-positive-percentage">
              {positivePercentage}%
            </p>
            <p className="mt-2 text-sm text-[#6B7280] dark:text-neutral-400">
              Users praise this app
            </p>
          </div>
        </Card>

        <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-[#6B7280] dark:text-neutral-400">
            Negative Reviews
          </h3>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-red-600 dark:text-red-400" data-testid="text-negative-percentage">
              {negativePercentage}%
            </p>
            <p className="mt-2 text-sm text-[#6B7280] dark:text-neutral-400">
              Users criticize this app
            </p>
          </div>
        </Card>

        <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950">
            <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-[#6B7280] dark:text-neutral-400">
            Average Rating
          </h3>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-[#111827] dark:text-neutral-100" data-testid="text-average-rating">
              {averageRating.toFixed(1)}
            </p>
            <p className="mt-2 text-sm text-[#6B7280] dark:text-neutral-400" data-testid="text-total-reviews">
              Based on {totalReviews} reviews
            </p>
          </div>
        </Card>
      </div>

      {/* Feedback Categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-950">
            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-[#6B7280] dark:text-neutral-400">
            Top Positive Feedback
          </h3>
          <div className="mt-4 flex flex-wrap gap-2" data-testid="positive-categories">
            {positiveCategories.map((category, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              >
                {category}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
            <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-[#6B7280] dark:text-neutral-400">
            Top Negative Feedback
          </h3>
          <div className="mt-4 flex flex-wrap gap-2" data-testid="negative-categories">
            {negativeCategories.map((category, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {category}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
